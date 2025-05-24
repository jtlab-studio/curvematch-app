use geo::LineString;
use gpx::Gpx;
use std::io::Cursor;
use crate::error::AppError;

pub fn parse_gpx(gpx_content: &str) -> Result<ParsedGpx, AppError> {
    let cursor = Cursor::new(gpx_content);
    let gpx: Gpx = gpx::read(cursor)
        .map_err(|e| AppError::FileError(format!("Failed to parse GPX: {}", e)))?;
    
    // Extract the first track and segment
    let track = gpx.tracks.first()
        .ok_or_else(|| AppError::FileError("No tracks found in GPX".to_string()))?;
    
    let segment = track.segments.first()
        .ok_or_else(|| AppError::FileError("No segments found in track".to_string()))?;
    
    // Convert to LineString
    let points: Vec<(f64, f64)> = segment.points.iter()
        .map(|p| (p.point().x(), p.point().y()))
        .collect();
    
    if points.len() < 2 {
        return Err(AppError::FileError("Track must have at least 2 points".to_string()));
    }
    
    let geometry = LineString::from(points);
    
    // Extract elevation profile
    let elevation_profile: Vec<f64> = segment.points.iter()
        .filter_map(|p| p.elevation)
        .collect();
    
    Ok(ParsedGpx {
        name: track.name.clone(),
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
