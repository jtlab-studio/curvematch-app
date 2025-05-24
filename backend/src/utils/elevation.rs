use geo::{LineString, Point};

pub fn interpolate_elevation_profile(
    line: &LineString<f64>,
    num_points: usize,
) -> Vec<f64> {
    // Simple elevation interpolation
    // In a real implementation, this would query a DEM service
    let points: Vec<Point<f64>> = line.points().collect();
    let total_points = points.len();
    
    if total_points == 0 || num_points == 0 {
        return vec![];
    }
    
    let mut profile = Vec::with_capacity(num_points);
    
    for i in 0..num_points {
        let position = i as f64 / (num_points - 1) as f64;
        let index = (position * (total_points - 1) as f64) as usize;
        
        // Simple elevation simulation based on location
        let point = &points[index.min(total_points - 1)];
        let base_elevation = 100.0;
        let variation = (point.x() * 100.0).sin() * 10.0 + (point.y() * 100.0).cos() * 5.0;
        
        profile.push(base_elevation + variation);
    }
    
    profile
}

pub fn calculate_elevation_stats(profile: &[f64]) -> ElevationStats {
    if profile.is_empty() {
        return ElevationStats::default();
    }
    
    let mut gain = 0.0;
    let mut loss = 0.0;
    let mut max_elevation = profile[0];
    let mut min_elevation = profile[0];
    
    for i in 1..profile.len() {
        let diff = profile[i] - profile[i - 1];
        if diff > 0.0 {
            gain += diff;
        } else {
            loss += diff.abs();
        }
        
        max_elevation = max_elevation.max(profile[i]);
        min_elevation = min_elevation.min(profile[i]);
    }
    
    ElevationStats {
        total_gain: gain,
        total_loss: loss,
        max_elevation,
        min_elevation,
    }
}

#[derive(Debug, Default)]
pub struct ElevationStats {
    pub total_gain: f64,
    pub total_loss: f64,
    pub max_elevation: f64,
    pub min_elevation: f64,
}
