use axum::{
    extract::{DefaultBodyLimit, Multipart, State},
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use serde::Serialize;
use sqlx::SqlitePool;
use tower::ServiceBuilder;
use tower_http::limit::RequestBodyLimitLayer;
use crate::{
    error::AppError,
    utils::gpx_parser::parse_gpx,
    utils::gpx_minifier::minify_gpx,
};

#[derive(Debug, Serialize)]
pub struct RouteMatch {
    pub id: String,
    pub name: String,
    pub distance: f64,
    #[serde(rename = "elevationGain")]
    pub elevation_gain: f64,
    #[serde(rename = "gainPerKm")]
    pub gain_per_km: f64,
    #[serde(rename = "matchPercentage")]
    pub match_percentage: f64,
    #[serde(rename = "curveScore")]
    pub curve_score: f64,
    pub geometry: serde_json::Value,
    #[serde(rename = "elevationProfile")]
    pub elevation_profile: Vec<f64>,
}

#[derive(Debug, Serialize)]
pub struct MatchResponse {
    pub matches: Vec<RouteMatch>,
}

pub fn routes() -> Router<SqlitePool> {
    Router::new()
        .route("/match", post(match_routes))
        // Add body limit of 50MB for the match endpoint
        .layer(
            ServiceBuilder::new()
                .layer(DefaultBodyLimit::max(50 * 1024 * 1024)) // 50MB
                .layer(RequestBodyLimitLayer::new(50 * 1024 * 1024))
        )
}

async fn match_routes(
    State(_pool): State<SqlitePool>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    tracing::info!("Match endpoint called");
    
    let mut gpx_data = Vec::new();
    let mut _distance_flexibility = 10.0;
    let mut _elevation_flexibility = 10.0;
    let mut _safety_mode = "Moderate".to_string();
    let mut _search_area: Option<serde_json::Value> = None;
    let mut fields_received = Vec::new();
    
    // Parse multipart form data
    while let Some(field) = multipart.next_field().await
        .map_err(|e| {
            tracing::error!("Failed to get next multipart field: {}", e);
            AppError::BadRequest(format!("Failed to read multipart data: {}", e))
        })? 
    {
        let name = field.name().unwrap_or("unknown").to_string();
        let filename = field.file_name().map(|s| s.to_string());
        
        tracing::info!("Processing field: name={}, filename={:?}", name, filename);
        fields_received.push(name.clone());
        
        match name.as_str() {
            "gpxFile" => {
                // Read the file data in chunks
                let mut file_data = Vec::new();
                let mut chunk_count = 0;
                
                let mut field = field;
                while let Some(chunk) = field.chunk().await
                    .map_err(|e| {
                        tracing::error!("Failed to read chunk {}: {}", chunk_count, e);
                        AppError::BadRequest(format!("Failed to read file data: {}", e))
                    })?
                {
                    chunk_count += 1;
                    file_data.extend_from_slice(&chunk);
                }
                
                gpx_data = file_data;
                tracing::info!("GPX file received: {} bytes in {} chunks", gpx_data.len(), chunk_count);
            }
            "distanceFlexibility" => {
                let text = field.text().await
                    .map_err(|e| AppError::BadRequest(format!("Failed to read distance flexibility: {}", e)))?;
                _distance_flexibility = text.parse().unwrap_or(10.0);
            }
            "elevationFlexibility" => {
                let text = field.text().await
                    .map_err(|e| AppError::BadRequest(format!("Failed to read elevation flexibility: {}", e)))?;
                _elevation_flexibility = text.parse().unwrap_or(10.0);
            }
            "safetyMode" => {
                _safety_mode = field.text().await
                    .map_err(|e| AppError::BadRequest(format!("Failed to read safety mode: {}", e)))?;
            }
            "searchArea" => {
                let json_str = field.text().await
                    .map_err(|e| AppError::BadRequest(format!("Failed to read search area: {}", e)))?;
                _search_area = serde_json::from_str(&json_str).ok();
            }
            _ => {
                let _ = field.text().await;
                tracing::warn!("Unknown field: {}", name);
            }
        }
    }
    
    if gpx_data.is_empty() {
        return Err(AppError::BadRequest("No GPX file provided".to_string()));
    }
    
    // Convert to string
    let gpx_string = String::from_utf8(gpx_data)
        .map_err(|e| {
            tracing::error!("Invalid GPX file encoding: {}", e);
            AppError::BadRequest("Invalid GPX file encoding".to_string())
        })?;
    
    tracing::info!("Original GPX size: {} bytes", gpx_string.len());
    
    // Note: The frontend already minified the GPX, but we can double-check here
    let gpx_to_parse = if gpx_string.contains("<extensions>") || gpx_string.contains("<time>") {
        // If it contains extensions or timestamps, minify it
        match minify_gpx(&gpx_string) {
            Ok(minimal) => {
                tracing::info!(
                    "Backend minified GPX: {} bytes -> {} bytes ({:.1}% reduction)",
                    gpx_string.len(),
                    minimal.len(),
                    (1.0 - minimal.len() as f64 / gpx_string.len() as f64) * 100.0
                );
                minimal
            }
            Err(e) => {
                tracing::warn!("Failed to minify GPX on backend, using original: {}", e);
                gpx_string
            }
        }
    } else {
        tracing::info!("GPX appears to be already minified");
        gpx_string
    };
    
    // Parse the GPX
    let parsed_gpx = parse_gpx(&gpx_to_parse)?;
    
    tracing::info!(
        "Parsed GPX: {} points, {} elevations",
        parsed_gpx.geometry.0.len(),
        parsed_gpx.elevation_profile.len()
    );
    
    // TODO: Implement actual matching logic
    // For now, return mock data
    let matches = vec![
        RouteMatch {
            id: "1".to_string(),
            name: parsed_gpx.name.unwrap_or_else(|| "Matched Trail".to_string()),
            distance: 5000.0,
            elevation_gain: 250.0,
            gain_per_km: 50.0,
            match_percentage: 85.0,
            curve_score: 0.92,
            geometry: serde_json::json!({
                "type": "LineString",
                "coordinates": parsed_gpx.geometry.0.iter()
                    .take(10) // Just first 10 points for the mock
                    .map(|coord| [coord.x, coord.y])
                    .collect::<Vec<_>>()
            }),
            elevation_profile: parsed_gpx.elevation_profile.iter()
                .take(10)
                .cloned()
                .collect(),
        },
    ];
    
    tracing::info!("Returning {} matches", matches.len());
    Ok(Json(MatchResponse { matches }))
}