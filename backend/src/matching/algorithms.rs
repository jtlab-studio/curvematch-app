use geo::{LineString, Point};
use std::f64::consts::PI;

/// Calculate turn angle between three consecutive points
fn calculate_turn_angle(p1: &Point<f64>, p2: &Point<f64>, p3: &Point<f64>) -> f64 {
    let dx1 = p2.x() - p1.x();
    let dy1 = p2.y() - p1.y();
    let dx2 = p3.x() - p2.x();
    let dy2 = p3.y() - p2.y();
    
    let angle1 = dy1.atan2(dx1);
    let angle2 = dy2.atan2(dx2);
    
    let mut angle_diff = angle2 - angle1;
    
    // Normalize to [-π, π]
    while angle_diff > PI {
        angle_diff -= 2.0 * PI;
    }
    while angle_diff < -PI {
        angle_diff += 2.0 * PI;
    }
    
    angle_diff.abs()
}

/// Count significant turns in a route (turns > threshold radians)
pub fn count_turns(line: &LineString<f64>, threshold_degrees: f64) -> usize {
    let threshold_rad = threshold_degrees * PI / 180.0;
    let points: Vec<Point<f64>> = line.points().collect();
    
    if points.len() < 3 {
        return 0;
    }
    
    let mut turn_count = 0;
    for i in 1..points.len() - 1 {
        let angle = calculate_turn_angle(&points[i-1], &points[i], &points[i+1]);
        if angle > threshold_rad {
            turn_count += 1;
        }
    }
    
    turn_count
}

/// Calculate total curvature of a route
pub fn calculate_curvature(line: &LineString<f64>) -> f64 {
    let points: Vec<Point<f64>> = line.points().collect();
    
    if points.len() < 3 {
        return 0.0;
    }
    
    let mut total_curvature = 0.0;
    for i in 1..points.len() - 1 {
        let angle = calculate_turn_angle(&points[i-1], &points[i], &points[i+1]);
        total_curvature += angle;
    }
    
    total_curvature
}

/// Calculate rolling gradients for a route
pub fn calculate_rolling_gradients(
    elevations: &[f64],
    distances: &[f64],
    window_size_m: f64,
) -> Vec<f64> {
    if elevations.is_empty() || distances.is_empty() || elevations.len() != distances.len() {
        return vec![];
    }
    
    let mut gradients = Vec::with_capacity(elevations.len());
    
    for i in 0..elevations.len() {
        let current_dist = distances[i];
        let window_start = current_dist - window_size_m / 2.0;
        let window_end = current_dist + window_size_m / 2.0;
        
        // Find points within the window
        let mut window_points = Vec::new();
        for j in 0..distances.len() {
            if distances[j] >= window_start && distances[j] <= window_end {
                window_points.push((distances[j], elevations[j]));
            }
        }
        
        // Calculate gradient for this window
        if window_points.len() >= 2 {
            // Use linear regression for smooth gradient calculation
            let gradient = calculate_gradient_linear_regression(&window_points);
            gradients.push(gradient);
        } else if i > 0 {
            // Fallback to simple gradient if not enough points
            let dist_diff = distances[i] - distances[i-1];
            let elev_diff = elevations[i] - elevations[i-1];
            let gradient = if dist_diff > 0.0 { 
                (elev_diff / dist_diff) * 100.0 // Convert to percentage
            } else { 
                0.0 
            };
            gradients.push(gradient);
        } else {
            gradients.push(0.0);
        }
    }
    
    gradients
}

/// Calculate gradient using linear regression for smoothing
fn calculate_gradient_linear_regression(points: &[(f64, f64)]) -> f64 {
    let n = points.len() as f64;
    if n < 2.0 {
        return 0.0;
    }
    
    let sum_x: f64 = points.iter().map(|(x, _)| x).sum();
    let sum_y: f64 = points.iter().map(|(_, y)| y).sum();
    let sum_xy: f64 = points.iter().map(|(x, y)| x * y).sum();
    let sum_x2: f64 = points.iter().map(|(x, _)| x * x).sum();
    
    let denominator = n * sum_x2 - sum_x * sum_x;
    if denominator.abs() < 1e-10 {
        return 0.0;
    }
    
    let slope = (n * sum_xy - sum_x * sum_y) / denominator;
    slope * 100.0 // Convert to percentage
}

/// Compare rolling gradient profiles using correlation
pub fn gradient_profile_similarity(
    gradients1: &[f64],
    gradients2: &[f64],
) -> f64 {
    if gradients1.is_empty() || gradients2.is_empty() {
        return 0.0;
    }
    
    // Resample to same length using linear interpolation
    let target_len = gradients1.len().max(gradients2.len());
    let resampled1 = resample_gradients(gradients1, target_len);
    let resampled2 = resample_gradients(gradients2, target_len);
    
    // Calculate correlation coefficient
    let correlation = calculate_correlation(&resampled1, &resampled2);
    
    // Convert to 0-1 similarity score
    (correlation + 1.0) / 2.0
}

/// Resample gradients to a target length
fn resample_gradients(gradients: &[f64], target_len: usize) -> Vec<f64> {
    if gradients.len() == target_len {
        return gradients.to_vec();
    }
    
    let mut resampled = Vec::with_capacity(target_len);
    let scale = (gradients.len() - 1) as f64 / (target_len - 1) as f64;
    
    for i in 0..target_len {
        let source_idx = i as f64 * scale;
        let idx = source_idx.floor() as usize;
        let fraction = source_idx - idx as f64;
        
        if idx + 1 < gradients.len() {
            let interpolated = gradients[idx] * (1.0 - fraction) + gradients[idx + 1] * fraction;
            resampled.push(interpolated);
        } else {
            resampled.push(gradients[idx]);
        }
    }
    
    resampled
}

/// Calculate Pearson correlation coefficient
fn calculate_correlation(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.is_empty() {
        return 0.0;
    }
    
    let n = x.len() as f64;
    let sum_x: f64 = x.iter().sum();
    let sum_y: f64 = y.iter().sum();
    let sum_xy: f64 = x.iter().zip(y.iter()).map(|(a, b)| a * b).sum();
    let sum_x2: f64 = x.iter().map(|a| a * a).sum();
    let sum_y2: f64 = y.iter().map(|b| b * b).sum();
    
    let numerator = n * sum_xy - sum_x * sum_y;
    let denominator = ((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)).sqrt();
    
    if denominator < 1e-10 {
        return 0.0;
    }
    
    numerator / denominator
}

/// Enhanced elevation profile similarity using Dynamic Time Warping
pub fn elevation_profile_dtw(
    profile1: &[f64],
    profile2: &[f64],
    window_size: usize,
) -> f64 {
    if profile1.is_empty() || profile2.is_empty() {
        return 0.0;
    }
    
    let n = profile1.len();
    let m = profile2.len();
    
    // Initialize DTW matrix
    let mut dtw = vec![vec![f64::INFINITY; m + 1]; n + 1];
    dtw[0][0] = 0.0;
    
    // Fill the DTW matrix with windowing
    for i in 1..=n {
        let window_start = if i > window_size { i - window_size } else { 1 };
        let window_end = (i + window_size).min(m);
        
        for j in window_start..=window_end {
            let cost = (profile1[i-1] - profile2[j-1]).abs();
            dtw[i][j] = cost + dtw[i-1][j].min(dtw[i][j-1]).min(dtw[i-1][j-1]);
        }
    }
    
    // Normalize by path length
    let path_length = n + m;
    let normalized_distance = dtw[n][m] / path_length as f64;
    
    // Convert to similarity score (0-1)
    1.0 / (1.0 + normalized_distance / 10.0)
}

/// Rolling gradient elevation similarity - main matching function
pub fn rolling_gradient_elevation_similarity(
    profile1: &[f64],
    profile2: &[f64],
    distances1: &[f64],
    distances2: &[f64],
    granularity_m: f64,
) -> f64 {
    // Calculate rolling gradients for both profiles
    let gradients1 = calculate_rolling_gradients(profile1, distances1, granularity_m);
    let gradients2 = calculate_rolling_gradients(profile2, distances2, granularity_m);
    
    // Compare gradient profiles
    gradient_profile_similarity(&gradients1, &gradients2)
}

/// Original Hausdorff distance for shape matching (optional)
pub fn hausdorff_distance(line1: &LineString<f64>, line2: &LineString<f64>) -> f64 {
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
    1.0 / (1.0 + hausdorff / 1000.0)
}

/// Turn sequence similarity
pub fn turn_sequence_similarity(line1: &LineString<f64>, line2: &LineString<f64>) -> f64 {
    let turns1 = count_turns(line1, 30.0);
    let turns2 = count_turns(line2, 30.0);
    
    if turns1 == 0 && turns2 == 0 {
        return 1.0;
    }
    
    let max_turns = turns1.max(turns2) as f64;
    let diff = (turns1 as f64 - turns2 as f64).abs();
    
    1.0 - (diff / max_turns).min(1.0)
}

fn euclidean_distance(p1: &Point<f64>, p2: &Point<f64>) -> f64 {
    let dx = p1.x() - p2.x();
    let dy = p1.y() - p2.y();
    (dx * dx + dy * dy).sqrt()
}

pub fn frechet_distance(line1: &LineString<f64>, line2: &LineString<f64>) -> f64 {
    hausdorff_distance(line1, line2)
}

/// Legacy elevation similarity for backward compatibility
pub fn elevation_similarity(
    profile1: &[f64],
    profile2: &[f64],
    flexibility: f64,
) -> f64 {
    elevation_profile_dtw(profile1, profile2, 50)
}

/// Legacy segmented elevation similarity
pub fn segmented_elevation_similarity(
    profile1: &[f64],
    profile2: &[f64],
    distances1: &[f64],
    distances2: &[f64],
    segment_length_km: f64,
) -> f64 {
    // Convert km to meters and use rolling gradient
    rolling_gradient_elevation_similarity(
        profile1, 
        profile2, 
        distances1, 
        distances2, 
        segment_length_km * 1000.0
    )
}