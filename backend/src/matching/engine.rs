use geo::LineString;
use sqlx::SqlitePool;
use crate::error::AppError;
use super::algorithms::{
    hausdorff_distance, elevation_similarity, frechet_distance,
    rolling_gradient_elevation_similarity, turn_sequence_similarity,
    count_turns, elevation_profile_dtw
};
use super::spatial_index::SpatialIndex;

#[derive(Debug, Clone)]
pub struct MatchingConfig {
    pub distance_flexibility: f64,
    pub elevation_flexibility: f64,
    pub shape_importance: f64,
    pub turns_importance: f64,
    pub elevation_importance: f64,
    pub granularity_meters: f64,  // New field for gradient calculation granularity
}

impl Default for MatchingConfig {
    fn default() -> Self {
        Self {
            distance_flexibility: 20.0,
            elevation_flexibility: 20.0,
            shape_importance: 0.0,
            turns_importance: 0.0,
            elevation_importance: 100.0,
            granularity_meters: 100.0,  // Default 100m granularity
        }
    }
}

pub struct MatchingEngine {
    spatial_index: SpatialIndex,
}

impl MatchingEngine {
    pub fn new() -> Self {
        Self {
            spatial_index: SpatialIndex::new(),
        }
    }
    
    pub async fn from_database(pool: &SqlitePool) -> Result<Self, sqlx::Error> {
        Ok(Self {
            spatial_index: SpatialIndex::from_database(pool).await?,
        })
    }
    
    pub fn find_matches_with_config(
        &self,
        input_route: &LineString<f64>,
        input_elevation: &[f64],
        search_bounds: (f64, f64, f64, f64),
        config: MatchingConfig,
    ) -> Result<Vec<MatchResult>, AppError> {
        let input_distance = calculate_distance(input_route);
        let input_elevation_gain = calculate_elevation_gain(input_elevation);
        let input_turns = count_turns(input_route, 30.0);
        
        // Create distance array for gradient matching
        let input_distances = create_distance_array(input_route);
        
        tracing::info!(
            "Searching for routes: distance={:.0}m, gain={:.0}m, turns={}, granularity={:.0}m",
            input_distance, input_elevation_gain, input_turns, config.granularity_meters
        );
        
        // Define acceptable ranges
        let min_distance = input_distance * (1.0 - config.distance_flexibility / 100.0);
        let max_distance = input_distance * (1.0 + config.distance_flexibility / 100.0);
        
        // Query spatial index for candidates within bounds
        let candidates = self.spatial_index.query_bounds(search_bounds);
        tracing::info!("Found {} candidate routes in search area", candidates.len());
        
        let mut results = Vec::new();
        
        for candidate in candidates {
            // Check distance constraint
            if candidate.distance < min_distance || candidate.distance > max_distance {
                continue;
            }
            
            // Calculate individual scores based on importance settings
            let mut total_score = 0.0;
            let mut total_weight = 0.0;
            
            // Rolling gradient elevation matching (most important by default)
            if config.elevation_importance > 0.0 {
                let candidate_distances = create_distance_array(&candidate.geometry);
                let elevation_score = rolling_gradient_elevation_similarity(
                    input_elevation,
                    &candidate.elevation_profile,
                    &input_distances,
                    &candidate_distances,
                    config.granularity_meters,
                );
                
                tracing::debug!(
                    "Route {} gradient similarity: {:.3}",
                    candidate.name, elevation_score
                );
                
                total_score += elevation_score * config.elevation_importance;
                total_weight += config.elevation_importance;
            }
            
            // Shape matching (optional)
            if config.shape_importance > 0.0 {
                let shape_score = hausdorff_distance(input_route, &candidate.geometry);
                total_score += shape_score * config.shape_importance;
                total_weight += config.shape_importance;
            }
            
            // Turn sequence matching (optional)
            if config.turns_importance > 0.0 {
                let turn_score = turn_sequence_similarity(input_route, &candidate.geometry);
                total_score += turn_score * config.turns_importance;
                total_weight += config.turns_importance;
            }
            
            // Calculate final score
            let final_score = if total_weight > 0.0 {
                total_score / total_weight
            } else {
                0.5
            };
            
            let match_percentage = final_score * 100.0;
            
            tracing::debug!(
                "Route {} final score: {:.2} (match={:.1}%)",
                candidate.name, final_score, match_percentage
            );
            
            // Only include matches above 25% (lowered threshold for gradient matching)
            if match_percentage >= 25.0 {
                results.push(MatchResult {
                    id: candidate.id.clone(),
                    name: candidate.name.clone(),
                    distance: candidate.distance,
                    elevation_gain: candidate.elevation_gain,
                    gain_per_km: candidate.elevation_gain / (candidate.distance / 1000.0),
                    match_percentage,
                    curve_score: final_score,
                    geometry: candidate.geometry.clone(),
                    elevation_profile: candidate.elevation_profile.clone(),
                });
            }
        }
        
        // Sort by match percentage descending
        results.sort_by(|a, b| b.match_percentage.partial_cmp(&a.match_percentage).unwrap());
        
        tracing::info!("Found {} matching routes above 25% threshold", results.len());
        
        Ok(results)
    }
    
    // Backward compatibility method
    pub fn find_matches(
        &self,
        input_route: &LineString<f64>,
        input_elevation: &[f64],
        search_bounds: (f64, f64, f64, f64),
        distance_flexibility: f64,
        elevation_flexibility: f64,
    ) -> Result<Vec<MatchResult>, AppError> {
        let config = MatchingConfig {
            distance_flexibility,
            elevation_flexibility,
            ..Default::default()
        };
        self.find_matches_with_config(input_route, input_elevation, search_bounds, config)
    }
}

#[derive(Debug, Clone)]
pub struct MatchResult {
    pub id: String,
    pub name: String,
    pub distance: f64,
    pub elevation_gain: f64,
    pub gain_per_km: f64,
    pub match_percentage: f64,
    pub curve_score: f64,
    pub geometry: LineString<f64>,
    pub elevation_profile: Vec<f64>,
}

pub fn calculate_distance(line: &LineString<f64>) -> f64 {
    let mut distance = 0.0;
    let points: Vec<_> = line.points().collect();
    
    for i in 1..points.len() {
        let p1 = &points[i - 1];
        let p2 = &points[i];
        distance += haversine_distance(p1.y(), p1.x(), p2.y(), p2.x());
    }
    
    distance
}

fn create_distance_array(line: &LineString<f64>) -> Vec<f64> {
    let mut distances = vec![0.0];
    let points: Vec<_> = line.points().collect();
    
    for i in 1..points.len() {
        let p1 = &points[i - 1];
        let p2 = &points[i];
        let segment_dist = haversine_distance(p1.y(), p1.x(), p2.y(), p2.x());
        distances.push(distances.last().unwrap() + segment_dist);
    }
    
    distances
}

pub fn haversine_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    const R: f64 = 6371000.0;
    
    let lat1_rad = lat1.to_radians();
    let lat2_rad = lat2.to_radians();
    let delta_lat = (lat2 - lat1).to_radians();
    let delta_lon = (lon2 - lon1).to_radians();
    
    let a = (delta_lat / 2.0).sin().powi(2)
        + lat1_rad.cos() * lat2_rad.cos() * (delta_lon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    
    R * c
}

pub fn calculate_elevation_gain(elevations: &[f64]) -> f64 {
    let mut gain = 0.0;
    
    for i in 1..elevations.len() {
        let diff = elevations[i] - elevations[i - 1];
        if diff > 0.0 {
            gain += diff;
        }
    }
    
    gain
}