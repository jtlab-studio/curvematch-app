use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SaveRouteRequest {
    pub name: String,
    pub tag: String,
    pub area: SearchArea,
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
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SearchArea {
    pub west: f64,
    pub south: f64,
    pub east: f64,
    pub north: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRouteRequest {
    pub name: Option<String>,
}