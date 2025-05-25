use axum::{
    extract::{Path, State},
    http::{header, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use crate::{
    error::AppError,
    db::queries::routes::{save_route as db_save_route, get_route_by_id},
    models::request::{SaveRouteRequest, SearchArea},
};

pub fn routes() -> Router<SqlitePool> {
    Router::new()
        .route("/route/:id/save", post(save_route))
        .route("/route/:id/gpx", get(download_gpx))
}

async fn save_route(
    State(pool): State<SqlitePool>,
    Path(_route_id): Path<String>,
    Json(payload): Json<SaveRouteRequest>,
) -> Result<impl IntoResponse, AppError> {
    // TODO: Get user_id from auth context when middleware is implemented
    let user_id = 1; // Placeholder for now
    
    // Use all fields from SaveRouteRequest
    let geom_wkt = serde_json::to_string(&payload.geometry)
        .map_err(|_| AppError::BadRequest("Invalid geometry".to_string()))?;
    
    let elevation_profile_json = serde_json::to_string(&payload.elevation_profile)
        .map_err(|_| AppError::BadRequest("Invalid elevation profile".to_string()))?;
    
    let search_area_json = serde_json::to_string(&payload.area)
        .map_err(|_| AppError::BadRequest("Invalid search area".to_string()))?;
    
    // Create GPX data
    let gpx_data = generate_gpx(&payload)?;
    
    // Save to database using all fields
    let saved_route = db_save_route(
        &pool,
        user_id,
        &payload.name,
        &payload.tag,
        payload.distance,
        payload.elevation_gain,
        payload.gain_per_km,
        payload.curve_score,
        payload.match_percentage,
        &geom_wkt,
        &elevation_profile_json,
        &search_area_json,
        &gpx_data,
    ).await?;
    
    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "id": saved_route.id,
            "message": "Route saved successfully"
        }))
    ))
}

async fn download_gpx(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    let route = get_route_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Route not found".to_string()))?;
    
    Ok((
        StatusCode::OK,
        [(header::CONTENT_TYPE, "application/gpx+xml")],
        route.gpx_data,
    ))
}

fn generate_gpx(route: &SaveRouteRequest) -> Result<Vec<u8>, AppError> {
    let mut gpx = String::from(r#"<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CurveMatch"
     xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>"#);
    
    gpx.push_str(&route.name);
    gpx.push_str("</name>\n    <trkseg>\n");
    
    // Add track points from geometry
    if let Some(coords) = route.geometry.get("coordinates").and_then(|c| c.as_array()) {
        for (idx, coord) in coords.iter().enumerate() {
            if let Some(arr) = coord.as_array() {
                if let (Some(lon), Some(lat)) = (arr.get(0), arr.get(1)) {
                    gpx.push_str(&format!(
                        "      <trkpt lat=\"{}\" lon=\"{}\">\n",
                        lat, lon
                    ));
                    
                    // Add elevation if available
                    if idx < route.elevation_profile.len() {
                        gpx.push_str(&format!(
                            "        <ele>{}</ele>\n",
                            route.elevation_profile[idx]
                        ));
                    }
                    
                    gpx.push_str("      </trkpt>\n");
                }
            }
        }
    }
    
    gpx.push_str("    </trkseg>\n  </trk>\n</gpx>");
    
    Ok(gpx.into_bytes())
}