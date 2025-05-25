use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use crate::{
    auth::{jwt::create_token, password::{hash_password, verify_password}},
    db::queries::users::{create_user, find_user_by_email},
    error::AppError,
    models::user::User,
};

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct SignupRequest {
    pub email: String,
    pub username: String,
    pub password: String,
    #[serde(rename = "confirmPassword")]
    pub confirm_password: String,
    pub interest: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: User,
}

pub fn routes() -> Router<SqlitePool> {
    Router::new()
        .route("/login", post(login))
        .route("/signup", post(signup))
        .route("/logout", post(logout))
}

async fn login(
    State(pool): State<SqlitePool>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Find user by email
    let user = find_user_by_email(&pool, &payload.email)
        .await?
        .ok_or_else(|| AppError::BadRequest("Invalid email or password".to_string()))?;
    
    // Verify password
    if !verify_password(&payload.password, &user.password_hash)? {
        return Err(AppError::BadRequest("Invalid email or password".to_string()));
    }
    
    // Create JWT token
    let token = create_token(user.id)?;
    
    // Return response with cookie
    let cookie = format!(
        "token={}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800",
        token
    );
    
    Ok((
        StatusCode::OK,
        [("Set-Cookie", cookie)],
        Json(AuthResponse { user: user.into() }),
    ))
}

async fn signup(
    State(pool): State<SqlitePool>,
    Json(payload): Json<SignupRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate passwords match
    if payload.password != payload.confirm_password {
        return Err(AppError::BadRequest("Passwords do not match".to_string()));
    }
    
    // Check if email already exists
    if find_user_by_email(&pool, &payload.email).await?.is_some() {
        return Err(AppError::BadRequest("Email already exists".to_string()));
    }
    
    // Log user interest if provided
    if let Some(ref interest) = payload.interest {
        tracing::info!("New user signup with interest: {}", interest);
    }
    
    // Hash password
    let (password_salt, password_hash) = hash_password(&payload.password)?;
    
    // Create user
    let user = create_user(
        &pool,
        &payload.email,
        &payload.username,
        &password_salt,
        &password_hash,
    )
    .await?;
    
    // Create JWT token
    let token = create_token(user.id)?;
    
    // Return response with cookie
    let cookie = format!(
        "token={}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800",
        token
    );
    
    Ok((
        StatusCode::OK,
        [("Set-Cookie", cookie)],
        Json(AuthResponse { user: user.into() }),
    ))
}

async fn logout() -> impl IntoResponse {
    let cookie = "token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
    
    (
        StatusCode::OK,
        [("Set-Cookie", cookie)],
        Json(serde_json::json!({ "success": true })),
    )
}