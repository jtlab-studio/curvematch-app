use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SaveRouteRequest {
    pub name: String,
    pub tag: String,
    pub area: SearchArea,
    // Additional route data fields would go here
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
