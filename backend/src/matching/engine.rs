use geo::LineString;
use crate::error::AppError;
use super::algorithms::{hausdorff_distance, elevation_similarity};
use super::spatial_index::SpatialIndex;

pub struct MatchingEngine {
    spatial_index: SpatialIndex,
}

impl MatchingEngine {
    pub fn new() -> Self {
        Self {
            spatial_index: SpatialIndex::new(),
        }
    }
    
    pub fn find_matches(
        &self,
        input_route: &LineString<f64>,
        input_elevation: &[f64],
        search_bounds: (f64, f64, f64, f64), // (west, south, east, north)
        distance_flexibility: f64,
        elevation_flexibility: f64,
    ) -> Result<Vec<MatchResult>, AppError> {
        // Calculate input route properties
        let input_distance = calculate_distance(input_route);
        let _input_elevation_gain = calculate_elevation_gain(input_elevation);
        
        // Define acceptable ranges
        let min_distance = input_distance * (1.0 - distance_flexibility / 100.0);
        let max_distance = input_distance * (1.0 + distance_flexibility / 100.0);
        
        // Query spatial index for candidates within bounds
        let candidates = self.spatial_index.query_bounds(search_bounds);
        
        let mut results = Vec::new();
        
        for candidate in candidates {
            // Check distance constraint
            if candidate.distance < min_distance || candidate.distance > max_distance {
                continue;
            }
            
            // Calculate similarity scores
            let distance_score = hausdorff_distance(input_route, &candidate.geometry);
            let elevation_score = elevation_similarity(
                input_elevation,
                &candidate.elevation_profile,
                elevation_flexibility,
            );
            
            // Combined score
            let curve_score = (distance_score + elevation_score) / 2.0;
            let match_percentage = curve_score * 100.0;
            
            results.push(MatchResult {
                id: candidate.id.clone(),
                name: candidate.name.clone(),
                distance: candidate.distance,
                elevation_gain: candidate.elevation_gain,
                gain_per_km: candidate.elevation_gain / (candidate.distance / 1000.0),
                match_percentage,
                curve_score,
                geometry: candidate.geometry.clone(),
                elevation_profile: candidate.elevation_profile.clone(),
            });
        }
        
        // Sort by match percentage
        results.sort_by(|a, b| b.match_percentage.partial_cmp(&a.match_percentage).unwrap());
        
        Ok(results)
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

fn calculate_distance(line: &LineString<f64>) -> f64 {
    let mut distance = 0.0;
    let points: Vec<_> = line.points().collect();
    
    for i in 1..points.len() {
        let p1 = &points[i - 1];
        let p2 = &points[i];
        distance += haversine_distance(p1.y(), p1.x(), p2.y(), p2.x());
    }
    
    distance
}

fn haversine_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    const R: f64 = 6371000.0; // Earth radius in meters
    
    let lat1_rad = lat1.to_radians();
    let lat2_rad = lat2.to_radians();
    let delta_lat = (lat2 - lat1).to_radians();
    let delta_lon = (lon2 - lon1).to_radians();
    
    let a = (delta_lat / 2.0).sin().powi(2)
        + lat1_rad.cos() * lat2_rad.cos() * (delta_lon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    
    R * c
}

fn calculate_elevation_gain(elevations: &[f64]) -> f64 {
    let mut gain = 0.0;
    
    for i in 1..elevations.len() {
        let diff = elevations[i] - elevations[i - 1];
        if diff > 0.0 {
            gain += diff;
        }
    }
    
    gain
}
