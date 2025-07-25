// backend/src/utils/gpx_minifier.rs - FIXED version that actually reduces size

use gpx::{Gpx, Track, TrackSegment, Waypoint};
use geo::Point;
use std::io::Cursor;
use crate::error::AppError;

/// Minify a GPX string by keeping only essential data (lat, lon, elevation)
pub fn minify_gpx(gpx_content: &str) -> Result<String, AppError> {
    tracing::debug!("Minifying GPX content: {} bytes", gpx_content.len());
    
    // Parse the original GPX
    let cursor = Cursor::new(gpx_content);
    let original_gpx: Gpx = gpx::read(cursor)
        .map_err(|e| {
            tracing::error!("Failed to parse GPX for minification: {}", e);
            AppError::FileError(format!("Failed to parse GPX: {}", e))
        })?;
    
    // Create a new minimal GPX
    let mut minimal_gpx = Gpx {
        version: original_gpx.version,
        creator: Some("CurveMatch".to_string()),
        metadata: None, // Remove all metadata
        waypoints: vec![], // No waypoints
        tracks: vec![],
        routes: vec![], // No routes
    };
    
    // Process each track
    for (track_idx, track) in original_gpx.tracks.iter().enumerate() {
        let mut minimal_track = Track::new();
        
        // Only keep the name
        if let Some(ref name) = track.name {
            minimal_track.name = Some(name.clone());
        } else {
            minimal_track.name = Some(format!("Track {}", track_idx + 1));
        }
        
        // Process segments
        for segment in &track.segments {
            let mut minimal_segment = TrackSegment::new();
            
            // Keep only essential waypoint data
            for point in &segment.points {
                let coord = point.point();
                let geo_point = Point::new(coord.x(), coord.y());
                let mut minimal_point = Waypoint::new(geo_point);
                
                // Only keep elevation if available
                minimal_point.elevation = point.elevation;
                
                minimal_segment.points.push(minimal_point);
            }
            
            if !minimal_segment.points.is_empty() {
                minimal_track.segments.push(minimal_segment);
            }
        }
        
        if !minimal_track.segments.is_empty() {
            minimal_gpx.tracks.push(minimal_track);
        }
    }
    
    // Write minimal GPX
    let mut output = Vec::new();
    gpx::write(&minimal_gpx, &mut output)
        .map_err(|e| AppError::FileError(format!("Failed to write minimal GPX: {}", e)))?;
    
    let minimal_content = String::from_utf8(output)
        .map_err(|e| AppError::FileError(format!("Failed to convert minimal GPX: {}", e)))?;
    
    let original_points: usize = original_gpx.tracks.iter()
        .flat_map(|t| &t.segments)
        .map(|s| s.points.len())
        .sum();
    
    let minimal_points: usize = minimal_gpx.tracks.iter()
        .flat_map(|t| &t.segments)
        .map(|s| s.points.len())
        .sum();
    
    tracing::info!(
        "GPX minified: {} bytes -> {} bytes ({:.1}% reduction), {} points preserved",
        gpx_content.len(),
        minimal_content.len(),
        (1.0 - minimal_content.len() as f64 / gpx_content.len() as f64) * 100.0,
        minimal_points
    );
    
    Ok(minimal_content)
}

/// Estimate the size reduction we can achieve
pub fn estimate_reduction(gpx_content: &str) -> f64 {
    // Count various elements to estimate reduction
    let timestamp_count = gpx_content.matches("<time>").count();
    let extension_count = gpx_content.matches("<extensions>").count();
    let hr_count = gpx_content.matches("<hr>").count() + gpx_content.matches("hr>").count();
    let cad_count = gpx_content.matches("<cad>").count() + gpx_content.matches("cadence>").count();
    let speed_count = gpx_content.matches("<speed>").count();
    let extra_data = timestamp_count + extension_count + hr_count + cad_count + speed_count;
    
    // Rough estimate: each extra data point adds ~50 bytes
    let estimated_extra_bytes = extra_data * 50;
    let estimated_reduction = estimated_extra_bytes as f64 / gpx_content.len() as f64;
    
    tracing::debug!(
        "Estimated reduction: {:.1}% (found {} timestamps, {} extensions, {} hr, {} cad, {} speed)",
        estimated_reduction * 100.0,
        timestamp_count,
        extension_count,
        hr_count,
        cad_count,
        speed_count
    );
    
    estimated_reduction
}