use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, delete, patch},
    Json, Router,
};
use serde::Serialize;
use sqlx::SqlitePool;
use crate::{
    db::queries::routes::{get_user_routes, get_route_by_id, delete_route_by_id, update_route_name},
    error::AppError,
    models::request::UpdateRouteRequest,
};

#[derive(Debug, Serialize)]
pub struct SavedRoute {
    pub id: i64,
    pub name: String,
    pub tag: String,
    #[serde(rename = "savedAt")]
    pub saved_at: String,
    pub distance: f64,
    #[serde(rename = "elevationGain")]
    pub elevation_gain: f64,
    #[serde(rename = "gainPerKm")]
    pub gain_per_km: f64,
    #[serde(rename = "curveScore")]
    pub curve_score: f64,
    #[serde(rename = "matchPercentage")]
    pub match_percentage: f64,
}

pub fn routes() -> Router<SqlitePool> {
    Router::new()
        .route("/library", get(get_library))
        .route("/library/:id", get(get_route))
        .route("/library/:id", delete(delete_route))
        .route("/library/:id", patch(update_route))
        // TODO: Add authentication middleware when auth context is implemented
}

async fn get_library(
    State(pool): State<SqlitePool>,
) -> Result<impl IntoResponse, AppError> {
    // TODO: Get user ID from auth context
    let user_id = 1; // Placeholder
    
    let routes = get_user_routes(&pool, user_id).await?;
    Ok(Json(routes))
}

async fn get_route(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    let route = get_route_by_id(&pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Route not found".to_string()))?;
    
    Ok(Json(route))
}

async fn delete_route(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    delete_route_by_id(&pool, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn update_route(
    State(pool): State<SqlitePool>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateRouteRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Use the update_route_name function if name is provided
    if let Some(ref new_name) = payload.name {
        update_route_name(&pool, id, new_name).await?;
    }
    
    Ok(Json(serde_json::json!({
        "id": id,
        "message": "Route updated successfully"
    })))
}