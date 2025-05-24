use serde::{Deserialize, Serialize};
use crate::db::models::DbSavedRoute;

#[derive(Debug, Serialize, Deserialize)]
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
    pub geometry: serde_json::Value,
    #[serde(rename = "elevationProfile")]
    pub elevation_profile: Vec<f64>,
    #[serde(rename = "searchArea")]
    pub search_area: serde_json::Value,
}

impl From<DbSavedRoute> for SavedRoute {
    fn from(db_route: DbSavedRoute) -> Self {
        let geometry: serde_json::Value = serde_json::from_str(&db_route.geom_wkt)
            .unwrap_or(serde_json::json!({}));
        let elevation_profile: Vec<f64> = serde_json::from_str(&db_route.elevation_profile_json)
            .unwrap_or_default();
        let search_area: serde_json::Value = serde_json::from_str(&db_route.search_area_json)
            .unwrap_or(serde_json::json!({}));
        
        Self {
            id: db_route.id,
            name: db_route.name,
            tag: db_route.tag,
            saved_at: db_route.saved_at,
            distance: db_route.distance_m,
            elevation_gain: db_route.elevation_gain_m,
            gain_per_km: db_route.gain_per_km,
            curve_score: db_route.curve_score,
            match_percentage: db_route.match_pct,
            geometry,
            elevation_profile,
            search_area,
        }
    }
}
