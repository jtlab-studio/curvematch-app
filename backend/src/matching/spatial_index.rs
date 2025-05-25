use geo::LineString;
use rstar::{RTree, AABB, RTreeObject};
use crate::db::queries::routes::get_all_routes;
use sqlx::SqlitePool;

pub struct SpatialIndex {
    rtree: RTree<RouteEntry>,
}

impl SpatialIndex {
    pub fn new() -> Self {
        // In production, this would be initialized with routes from database
        // For now, use sample data
        let routes = Self::load_sample_routes();
        
        Self {
            rtree: RTree::bulk_load(routes),
        }
    }
    
    pub async fn from_database(pool: &SqlitePool) -> Result<Self, sqlx::Error> {
        let db_routes = get_all_routes(pool).await?;
        
        let mut routes = Vec::new();
        for route in db_routes {
            // Parse geometry from WKT or GeoJSON
            if let Ok(geometry) = serde_json::from_str::<serde_json::Value>(&route.geom_wkt) {
                if let Some(coords) = geometry.get("coordinates").and_then(|c| c.as_array()) {
                    let points: Vec<(f64, f64)> = coords.iter()
                        .filter_map(|coord| {
                            let arr = coord.as_array()?;
                            Some((arr.get(0)?.as_f64()?, arr.get(1)?.as_f64()?))
                        })
                        .collect();
                    
                    if points.len() >= 2 {
                        let line_string = LineString::from(points.clone());
                        let elevation_profile: Vec<f64> = serde_json::from_str(&route.elevation_profile_json)
                            .unwrap_or_default();
                        
                        // Calculate bounding box
                        let (min_x, max_x) = points.iter()
                            .map(|(x, _)| x)
                            .fold((f64::INFINITY, f64::NEG_INFINITY), |(min, max), x| {
                                (min.min(*x), max.max(*x))
                            });
                        let (min_y, max_y) = points.iter()
                            .map(|(_, y)| y)
                            .fold((f64::INFINITY, f64::NEG_INFINITY), |(min, max), y| {
                                (min.min(*y), max.max(*y))
                            });
                        
                        routes.push(RouteEntry {
                            id: route.id.to_string(),
                            name: route.name,
                            distance: route.distance_m,
                            elevation_gain: route.elevation_gain_m,
                            geometry: line_string,
                            elevation_profile,
                            bbox: AABB::from_corners([min_x, min_y], [max_x, max_y]),
                        });
                    }
                }
            }
        }
        
        // If no routes in database, use sample data
        if routes.is_empty() {
            routes = Self::load_sample_routes();
        }
        
        Ok(Self {
            rtree: RTree::bulk_load(routes),
        })
    }
    
    fn load_sample_routes() -> Vec<RouteEntry> {
        vec![
            RouteEntry {
                id: "1".to_string(),
                name: "Berlin Loop".to_string(),
                distance: 5000.0,
                elevation_gain: 50.0,
                geometry: LineString::from(vec![
                    (13.4050, 52.5200), (13.4150, 52.5250), (13.4200, 52.5300),
                    (13.4150, 52.5350), (13.4050, 52.5300), (13.4050, 52.5200)
                ]),
                elevation_profile: vec![100.0, 105.0, 110.0, 108.0, 105.0, 100.0],
                bbox: AABB::from_corners([13.4050, 52.5200], [13.4200, 52.5350]),
            },
            RouteEntry {
                id: "2".to_string(),
                name: "Tiergarten Trail".to_string(),
                distance: 8000.0,
                elevation_gain: 25.0,
                geometry: LineString::from(vec![
                    (13.3500, 52.5100), (13.3600, 52.5150), (13.3700, 52.5200),
                    (13.3650, 52.5250), (13.3550, 52.5200), (13.3500, 52.5100)
                ]),
                elevation_profile: vec![95.0, 98.0, 100.0, 99.0, 97.0, 95.0],
                bbox: AABB::from_corners([13.3500, 52.5100], [13.3700, 52.5250]),
            },
            RouteEntry {
                id: "3".to_string(),
                name: "Grunewald Forest Path".to_string(),
                distance: 12000.0,
                elevation_gain: 75.0,
                geometry: LineString::from(vec![
                    (13.2500, 52.4900), (13.2600, 52.4950), (13.2700, 52.5000),
                    (13.2800, 52.5050), (13.2750, 52.5100), (13.2650, 52.5050),
                    (13.2550, 52.5000), (13.2500, 52.4900)
                ]),
                elevation_profile: vec![110.0, 115.0, 120.0, 125.0, 122.0, 118.0, 114.0, 110.0],
                bbox: AABB::from_corners([13.2500, 52.4900], [13.2800, 52.5100]),
            },
        ]
    }
    
    pub fn query_bounds(&self, bounds: (f64, f64, f64, f64)) -> Vec<RouteEntry> {
        let (west, south, east, north) = bounds;
        let query_bbox = AABB::from_corners([west, south], [east, north]);
        
        self.rtree
            .locate_in_envelope_intersecting(&query_bbox)
            .cloned()
            .collect()
    }
}

#[derive(Clone, Debug)]
pub struct RouteEntry {
    pub id: String,
    pub name: String,
    pub distance: f64,
    pub elevation_gain: f64,
    pub geometry: LineString<f64>,
    pub elevation_profile: Vec<f64>,
    bbox: AABB<[f64; 2]>,
}

impl RTreeObject for RouteEntry {
    type Envelope = AABB<[f64; 2]>;
    
    fn envelope(&self) -> Self::Envelope {
        self.bbox
    }
}