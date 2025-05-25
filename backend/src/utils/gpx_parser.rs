use geo::LineString;
use gpx::Gpx;
use std::io::Cursor;
use crate::error::AppError;

pub fn parse_gpx(gpx_content: &str) -> Result<ParsedGpx, AppError> {
    tracing::debug!("Parsing GPX content: {} bytes", gpx_content.len());
    
    let cursor = Cursor::new(gpx_content);
    let gpx: Gpx = gpx::read(cursor)
        .map_err(|e| {
            tracing::error!("Failed to parse GPX: {}", e);
            tracing::error!("GPX content preview: {}", &gpx_content[..gpx_content.len().min(500)]);
            AppError::FileError(format!("Failed to parse GPX: {}", e))
        })?;
    
    // Extract the first track and segment
    let track = gpx.tracks.first()
        .ok_or_else(|| {
            tracing::error!("No tracks found in GPX");
            AppError::FileError("No tracks found in GPX".to_string())
        })?;
    
    let segment = track.segments.first()
        .ok_or_else(|| {
            tracing::error!("No segments found in track");
            AppError::FileError("No segments found in track".to_string())
        })?;
    
    // Convert to LineString
    let points: Vec<(f64, f64)> = segment.points.iter()
        .map(|p| (p.point().x(), p.point().y()))
        .collect();
    
    if points.len() < 2 {
        tracing::error!("Track has only {} points, need at least 2", points.len());
        return Err(AppError::FileError("Track must have at least 2 points".to_string()));
    }
    
    let geometry = LineString::from(points);
    
    // Extract elevation profile
    let elevation_profile: Vec<f64> = segment.points.iter()
        .filter_map(|p| p.elevation)
        .collect();
    
    // Get track name
    let name = track.name.clone();
    
    tracing::info!(
        "Parsed GPX: name={:?}, points={}, elevations={}", 
        name, 
        segment.points.len(),
        elevation_profile.len()
    );
    
    Ok(ParsedGpx {
        name,
        geometry,
        elevation_profile,
    })
}

#[derive(Debug)]
pub struct ParsedGpx {
    pub name: Option<String>,
    pub geometry: LineString<f64>,
    pub elevation_profile: Vec<f64>,
}