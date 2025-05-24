use axum::{
    extract::{Multipart, State},
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use serde::Serialize;
use sqlx::SqlitePool;
use crate::{
    error::AppError,
    utils::gpx_parser::parse_gpx,
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
}

async fn match_routes(
    State(_pool): State<SqlitePool>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    let mut gpx_data = Vec::new();
    let mut _distance_flexibility = 10.0;
    let mut _elevation_flexibility = 10.0;
    let mut _safety_mode = "Moderate".to_string();
    let mut _search_area: Option<serde_json::Value> = None;
    
    // Parse multipart form data
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        
        match name.as_str() {
            "gpxFile" => {
                gpx_data = field.bytes().await.unwrap().to_vec();
            }
            "distanceFlexibility" => {
                _distance_flexibility = field.text().await.unwrap().parse().unwrap_or(10.0);
            }
            "elevationFlexibility" => {
                _elevation_flexibility = field.text().await.unwrap().parse().unwrap_or(10.0);
            }
            "safetyMode" => {
                _safety_mode = field.text().await.unwrap();
            }
            "searchArea" => {
                let json_str = field.text().await.unwrap();
                _search_area = serde_json::from_str(&json_str).ok();
            }
            _ => {}
        }
    }
    
    if gpx_data.is_empty() {
        return Err(AppError::BadRequest("No GPX file provided".to_string()));
    }
    
    // Parse GPX file
    let gpx_string = String::from_utf8(gpx_data)
        .map_err(|_| AppError::BadRequest("Invalid GPX file".to_string()))?;
    
    let _gpx = parse_gpx(&gpx_string)?;
    
    // TODO: Implement actual matching logic using the parsed parameters
    // For now, return mock data
    let matches = vec![
        RouteMatch {
            id: "1".to_string(),
            name: "Sample Trail".to_string(),
            distance: 5000.0,
            elevation_gain: 250.0,
            gain_per_km: 50.0,
            match_percentage: 85.0,
            curve_score: 0.92,
            geometry: serde_json::json!({
                "type": "LineString",
                "coordinates": [[13.4050, 52.5200], [13.4060, 52.5210]]
            }),
            elevation_profile: vec![100.0, 120.0, 150.0, 180.0, 200.0],
        },
    ];
    
    Ok(Json(MatchResponse { matches }))
}
