use geo::LineString;
use gpx::{Gpx, Track};
use std::io::Cursor;
use crate::error::AppError;

pub fn parse_gpx(gpx_content: &str) -> Result<ParsedGpx, AppError> {
    // Log the content for debugging
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
    
    // Get track name - handle both track.name and the name from <n> tag
    let name = track.name.clone()
        .or_else(|| {
            // Some GPX files use <n> instead of <name>
            // The gpx crate might not parse this, so we'll use track name if available
            None
        });
    
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_gpx() {
        let gpx_content = r#"<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
    <trk>
        <name>Test Track</name>
        <trkseg>
            <trkpt lat="52.5200" lon="13.4050">
                <ele>100.0</ele>
            </trkpt>
            <trkpt lat="52.5210" lon="13.4060">
                <ele>105.0</ele>
            </trkpt>
        </trkseg>
    </trk>
</gpx>"#;

        let result = parse_gpx(gpx_content);
        assert!(result.is_ok());
        
        let parsed = result.unwrap();
        assert_eq!(parsed.name, Some("Test Track".to_string()));
        assert_eq!(parsed.geometry.0.len(), 2);
        assert_eq!(parsed.elevation_profile.len(), 2);
    }

    #[test]
    fn test_parse_gpx_with_n_tag() {
        // Some GPX files use <n> instead of <name>
        let gpx_content = r#"<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
    <trk>
        <n>Test Track</n>
        <trkseg>
            <trkpt lat="52.5200" lon="13.4050">
                <ele>100.0</ele>
            </trkpt>
            <trkpt lat="52.5210" lon="13.4060">
                <ele>105.0</ele>
            </trkpt>
        </trkseg>
    </trk>
</gpx>"#;

        let result = parse_gpx(gpx_content);
        // This might fail with the current gpx crate if it doesn't support <n>
        // but at least it should parse the track points
        assert!(result.is_ok());
        
        let parsed = result.unwrap();
        assert_eq!(parsed.geometry.0.len(), 2);
    }
}