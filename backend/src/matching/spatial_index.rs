use geo::LineString;
use rstar::{RTree, AABB, RTreeObject};
use crate::db::queries::routes::get_all_routes;
use sqlx::SqlitePool;

pub struct SpatialIndex {
    rtree: RTree<RouteEntry>,
}

impl SpatialIndex {
    pub fn new() -> Self {
        // Empty index - no mock data
        Self {
            rtree: RTree::new(),
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
        
        tracing::info!("Loaded {} routes from database", routes.len());
        
        Ok(Self {
            rtree: RTree::bulk_load(routes),
        })
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