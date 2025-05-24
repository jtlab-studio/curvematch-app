use axum::{
    extract::{Path, State},
    http::{header, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use sqlx::SqlitePool;
use crate::error::AppError;

pub fn routes() -> Router<SqlitePool> {
    Router::new()
        .route("/route/:id/save", post(save_route))
        .route("/route/:id/gpx", get(download_gpx))
}

async fn save_route(
    State(_pool): State<SqlitePool>,
    Path(id): Path<i64>,
    Json(_payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, AppError> {
    // TODO: Implement route saving logic
    Ok(Json(serde_json::json!({
        "id": id,
        "message": "Route saved successfully"
    })))
}

async fn download_gpx(
    State(_pool): State<SqlitePool>,
    Path(_id): Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    // TODO: Implement GPX download logic
    let gpx_data = b"<?xml version=\"1.0\" encoding=\"UTF-8\"?><gpx></gpx>";
    
    Ok((
        StatusCode::OK,
        [(header::CONTENT_TYPE, "application/gpx+xml")],
        gpx_data.to_vec(),
    ))
}
