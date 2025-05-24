use axum::Router;
use sqlx::SqlitePool;

mod auth;
mod routes;
mod library;
mod match_routes;

pub fn routes() -> Router<SqlitePool> {
    Router::new()
        .merge(auth::routes())
        .merge(routes::routes())
        .merge(library::routes())
        .merge(match_routes::routes())
}
