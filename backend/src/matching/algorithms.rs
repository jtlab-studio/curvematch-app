use geo::{LineString, Point};

pub fn hausdorff_distance(line1: &LineString<f64>, line2: &LineString<f64>) -> f64 {
    // Simplified Hausdorff distance calculation
    // Returns a similarity score between 0 and 1
    
    let max_dist1 = line1.points()
        .map(|p1| {
            line2.points()
                .map(|p2| euclidean_distance(&p1, &p2))
                .fold(f64::INFINITY, f64::min)
        })
        .fold(0.0, f64::max);
    
    let max_dist2 = line2.points()
        .map(|p2| {
            line1.points()
                .map(|p1| euclidean_distance(&p1, &p2))
                .fold(f64::INFINITY, f64::min)
        })
        .fold(0.0, f64::max);
    
    let hausdorff = max_dist1.max(max_dist2);
    
    // Convert to similarity score (inverse)
    1.0 / (1.0 + hausdorff)
}

pub fn elevation_similarity(
    profile1: &[f64],
    profile2: &[f64],
    flexibility: f64,
) -> f64 {
    // Normalize profiles to same length
    let len = profile1.len().min(profile2.len());
    
    if len == 0 {
        return 0.0;
    }
    
    // Calculate RMSE
    let mut sum_sq_diff = 0.0;
    for i in 0..len {
        let diff = profile1[i] - profile2[i];
        sum_sq_diff += diff * diff;
    }
    
    let rmse = (sum_sq_diff / len as f64).sqrt();
    
    // Convert to similarity score with flexibility
    let max_acceptable_diff = flexibility * 10.0; // flexibility as meters
    1.0 - (rmse / max_acceptable_diff).min(1.0)
}

fn euclidean_distance(p1: &Point<f64>, p2: &Point<f64>) -> f64 {
    let dx = p1.x() - p2.x();
    let dy = p1.y() - p2.y();
    (dx * dx + dy * dy).sqrt()
}

pub fn frechet_distance(line1: &LineString<f64>, line2: &LineString<f64>) -> f64 {
    // Simplified discrete Fréchet distance
    // This is a placeholder implementation
    hausdorff_distance(line1, line2)
}
