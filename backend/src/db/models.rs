use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct DbUser {
    pub id: i64,
    pub email: String,
    pub username: String,
    pub password_salt: String,
    pub password_hash: String,
    pub role: String,
    pub created_at: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct DbSavedRoute {
    pub id: i64,
    pub user_id: i64,
    pub name: String,
    pub tag: String,
    pub saved_at: String,
    pub distance_m: f64,
    pub elevation_gain_m: f64,
    pub gain_per_km: f64,
    pub curve_score: f64,
    pub match_pct: f64,
    pub geom_wkt: String,
    pub elevation_profile_json: String,
    pub search_area_json: String,
    pub gpx_data: Vec<u8>,
}
