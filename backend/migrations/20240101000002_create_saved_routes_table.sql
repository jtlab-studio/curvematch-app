-- Create saved routes table
CREATE TABLE IF NOT EXISTS saved_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tag TEXT NOT NULL,
    saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    distance_m REAL NOT NULL,
    elevation_gain_m REAL NOT NULL,
    gain_per_km REAL NOT NULL,
    curve_score REAL NOT NULL,
    match_pct REAL NOT NULL,
    geom_wkt TEXT NOT NULL,
    elevation_profile_json TEXT NOT NULL,
    search_area_json TEXT NOT NULL,
    gpx_data BLOB NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_routes_user_id ON saved_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_routes_saved_at ON saved_routes(saved_at);
