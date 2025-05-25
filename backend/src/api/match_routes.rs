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
    matching::engine::{MatchingEngine, calculate_distance},
    utils::elevation::calculate_elevation_stats,
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
    #[serde(rename = "inputRoute")]
    pub input_route: InputRouteInfo,
}

#[derive(Debug, Serialize)]
pub struct InputRouteInfo {
    pub name: String,
    pub distance: f64,
    #[serde(rename = "elevationGain")]
    pub elevation_gain: f64,
    pub geometry: serde_json::Value,
    #[serde(rename = "elevationProfile")]
    pub elevation_profile: Vec<f64>,
}

pub fn routes() -> Router<SqlitePool> {
    Router::new()
        .route("/match", post(match_routes))
        .layer(
            ServiceBuilder::new()
                .layer(DefaultBodyLimit::max(50 * 1024 * 1024))
                .layer(RequestBodyLimitLayer::new(50 * 1024 * 1024))
        )
}

async fn match_routes(
    State(pool): State<SqlitePool>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    tracing::info!("Match endpoint called");
    
    let mut gpx_data = Vec::new();
    let mut distance_flexibility = 10.0;
    let mut elevation_flexibility = 10.0;
    let mut _safety_mode = "Moderate".to_string();
    let mut search_area: Option<serde_json::Value> = None;
    let mut original_filename = String::new();
    
    // Parse multipart form data
    while let Some(field) = multipart.next_field().await
        .map_err(|e| AppError::BadRequest(format!("Failed to read multipart data: {}", e)))? 
    {
        let name = field.name().unwrap_or("unknown").to_string();
        
        match name.as_str() {
            "gpxFile" => {
                if let Some(filename) = field.file_name() {
                    original_filename = filename.to_string();
                }
                
                let mut file_data = Vec::new();
                let mut field = field;
                while let Some(chunk) = field.chunk().await
                    .map_err(|e| AppError::BadRequest(format!("Failed to read file data: {}", e)))?
                {
                    file_data.extend_from_slice(&chunk);
                }
                gpx_data = file_data;
                tracing::info!("GPX file received: {} bytes, filename: {}", gpx_data.len(), original_filename);
            }
            "distanceFlexibility" => {
                let text = field.text().await.unwrap_or_default();
                distance_flexibility = text.parse().unwrap_or(10.0);
            }
            "elevationFlexibility" => {
                let text = field.text().await.unwrap_or_default();
                elevation_flexibility = text.parse().unwrap_or(10.0);
            }
            "safetyMode" => {
                _safety_mode = field.text().await.unwrap_or_else(|_| "Moderate".to_string());
            }
            "searchArea" => {
                let json_str = field.text().await.unwrap_or_default();
                search_area = serde_json::from_str(&json_str).ok();
            }
            _ => {
                let _ = field.text().await;
            }
        }
    }
    
    if gpx_data.is_empty() {
        return Err(AppError::BadRequest("No GPX file provided".to_string()));
    }
    
    let search_bounds = search_area
        .as_ref()
        .and_then(|area| {
            let west = area.get("west")?.as_f64()?;
            let south = area.get("south")?.as_f64()?;
            let east = area.get("east")?.as_f64()?;
            let north = area.get("north")?.as_f64()?;
            Some((west, south, east, north))
        })
        .ok_or_else(|| AppError::BadRequest("Invalid search area".to_string()))?;
    
    // Convert to string
    let gpx_string = String::from_utf8(gpx_data)
        .map_err(|_| AppError::BadRequest("Invalid GPX file encoding".to_string()))?;
    
    // Try to minify the GPX
    let gpx_to_parse = match minify_gpx(&gpx_string) {
        Ok(minified) => {
            tracing::info!("Successfully minified GPX");
            minified
        }
        Err(e) => {
            tracing::warn!("Failed to minify GPX: {}, using original", e);
            gpx_string
        }
    };
    
    // Parse the GPX
    let parsed_gpx = parse_gpx(&gpx_to_parse)?;
    
    // Use the parsed GPX name or fallback to filename
    let route_name = parsed_gpx.name.clone()
        .unwrap_or_else(|| original_filename.replace(".gpx", ""));
    
    // Calculate route statistics
    let route_distance = calculate_distance(&parsed_gpx.geometry);
    let elevation_stats = calculate_elevation_stats(&parsed_gpx.elevation_profile);
    
    tracing::info!(
        "Parsed GPX: name={}, distance={:.0}m, elevation_gain={:.0}m, points={}",
        route_name, route_distance, elevation_stats.total_gain, parsed_gpx.geometry.0.len()
    );
    
    // Create matching engine with database connection
    let engine = MatchingEngine::from_database(&pool).await
        .map_err(|e| AppError::MatchingError(format!("Failed to initialize matching engine: {}", e)))?;
    
    let match_results = engine.find_matches(
        &parsed_gpx.geometry,
        &parsed_gpx.elevation_profile,
        search_bounds,
        distance_flexibility,
        elevation_flexibility,
    )?;
    
    // Convert matching results to API response format
    let matches: Vec<RouteMatch> = match_results
        .into_iter()
        .take(20)
        .map(|result| RouteMatch {
            id: result.id,
            name: result.name,
            distance: result.distance,
            elevation_gain: result.elevation_gain,
            gain_per_km: result.gain_per_km,
            match_percentage: result.match_percentage,
            curve_score: result.curve_score,
            geometry: serde_json::json!({
                "type": "LineString",
                "coordinates": result.geometry.0.iter()
                    .map(|coord| [coord.x, coord.y])
                    .collect::<Vec<_>>()
            }),
            elevation_profile: result.elevation_profile,
        })
        .collect();
    
    // Create input route info for frontend display
    let input_route = InputRouteInfo {
        name: route_name,
        distance: route_distance,
        elevation_gain: elevation_stats.total_gain,
        geometry: serde_json::json!({
            "type": "LineString",
            "coordinates": parsed_gpx.geometry.0.iter()
                .take(1000)
                .map(|coord| [coord.x, coord.y])
                .collect::<Vec<_>>()
        }),
        elevation_profile: parsed_gpx.elevation_profile.clone(),
    };
    
    tracing::info!("Returning {} matches", matches.len());
    Ok(Json(MatchResponse { matches, input_route }))
}