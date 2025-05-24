use axum::{
    Router,
    http::{Method, header, HeaderValue},
};
use sqlx::sqlite::SqlitePool;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api;
mod auth;
mod config;
mod db;
mod error;
mod matching;
mod models;
mod utils;

use crate::config::Config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "curvematch_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    
    // Connect to database
    let pool = SqlitePool::connect(&config.database_url).await?;
    
    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;
    
    // Set up CORS with more permissive settings for multipart
    let frontend_url = config.frontend_url.parse::<HeaderValue>()?;
    
    let cors = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::PATCH,
            Method::OPTIONS, // Important for preflight
        ])
        .allow_origin(frontend_url)
        .allow_headers([
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            header::ACCEPT,
            header::ORIGIN,
            header::ACCESS_CONTROL_REQUEST_METHOD,
            header::ACCESS_CONTROL_REQUEST_HEADERS,
        ])
        .allow_credentials(true)
        .expose_headers([
            header::CONTENT_TYPE,
            header::CONTENT_LENGTH,
        ])
        .max_age(std::time::Duration::from_secs(3600)); // Cache preflight for 1 hour
    
    // Build our application with routes
    let app = Router::new()
        .nest("/api", api::routes())
        .layer(cors)
        .with_state(pool);
    
    // Run the server
    let addr = SocketAddr::from(([127, 0, 0, 1], config.server_port));
    tracing::info!("Server listening on {}", addr);
    tracing::info!("Accepting requests from: {}", config.frontend_url);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}