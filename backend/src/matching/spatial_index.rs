use geo::LineString;
use rstar::{RTree, AABB, RTreeObject};

pub struct SpatialIndex {
    rtree: RTree<RouteEntry>,
}

impl SpatialIndex {
    pub fn new() -> Self {
        // In a real implementation, this would load routes from the database
        let routes = vec![
            RouteEntry {
                id: "1".to_string(),
                name: "Berlin Loop".to_string(),
                distance: 5000.0,
                elevation_gain: 50.0,
                geometry: LineString::from(vec![(13.4050, 52.5200), (13.4150, 52.5250)]),
                elevation_profile: vec![100.0, 105.0, 110.0, 108.0, 100.0],
                bbox: AABB::from_corners([13.4050, 52.5200], [13.4150, 52.5250]),
            },
            RouteEntry {
                id: "2".to_string(),
                name: "Tiergarten Trail".to_string(),
                distance: 8000.0,
                elevation_gain: 25.0,
                geometry: LineString::from(vec![(13.3500, 52.5100), (13.3700, 52.5150)]),
                elevation_profile: vec![95.0, 98.0, 100.0, 97.0, 95.0],
                bbox: AABB::from_corners([13.3500, 52.5100], [13.3700, 52.5150]),
            },
        ];
        
        Self {
            rtree: RTree::bulk_load(routes),
        }
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
