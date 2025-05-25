use sqlx::SqlitePool;
use crate::db::models::DbSavedRoute;
use crate::error::AppError;

pub async fn save_route(
    pool: &SqlitePool,
    user_id: i64,
    name: &str,
    tag: &str,
    distance_m: f64,
    elevation_gain_m: f64,
    gain_per_km: f64,
    curve_score: f64,
    match_pct: f64,
    geom_wkt: &str,
    elevation_profile_json: &str,
    search_area_json: &str,
    gpx_data: &[u8],
) -> Result<DbSavedRoute, AppError> {
    let result = sqlx::query_as::<_, DbSavedRoute>(
        r#"
        INSERT INTO saved_routes (
            user_id, name, tag, distance_m, elevation_gain_m,
            gain_per_km, curve_score, match_pct, geom_wkt,
            elevation_profile_json, search_area_json, gpx_data
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        RETURNING *
        "#,
    )
    .bind(user_id)
    .bind(name)
    .bind(tag)
    .bind(distance_m)
    .bind(elevation_gain_m)
    .bind(gain_per_km)
    .bind(curve_score)
    .bind(match_pct)
    .bind(geom_wkt)
    .bind(elevation_profile_json)
    .bind(search_area_json)
    .bind(gpx_data)
    .fetch_one(pool)
    .await?;
    
    Ok(result)
}

pub async fn get_user_routes(
    pool: &SqlitePool,
    user_id: i64,
) -> Result<Vec<DbSavedRoute>, AppError> {
    let routes = sqlx::query_as::<_, DbSavedRoute>(
        r#"
        SELECT * FROM saved_routes
        WHERE user_id = ?1
        ORDER BY saved_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    
    Ok(routes)
}

pub async fn get_route_by_id(
    pool: &SqlitePool,
    id: i64,
) -> Result<Option<DbSavedRoute>, AppError> {
    let route = sqlx::query_as::<_, DbSavedRoute>(
        r#"
        SELECT * FROM saved_routes WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    Ok(route)
}

pub async fn delete_route_by_id(
    pool: &SqlitePool,
    id: i64,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        DELETE FROM saved_routes WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;
    
    Ok(())
}

pub async fn update_route_name(
    pool: &SqlitePool,
    id: i64,
    name: &str,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        UPDATE saved_routes SET name = ?1 WHERE id = ?2
        "#,
    )
    .bind(name)
    .bind(id)
    .execute(pool)
    .await?;
    
    Ok(())
}


pub async fn get_all_routes(
    pool: &SqlitePool,
) -> Result<Vec<DbSavedRoute>, sqlx::Error> {
    let routes = sqlx::query_as::<_, DbSavedRoute>(
        r#"
        SELECT * FROM saved_routes
        ORDER BY saved_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;
    
    Ok(routes)
}