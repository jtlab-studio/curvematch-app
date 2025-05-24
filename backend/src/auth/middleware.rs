use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use axum_extra::extract::CookieJar;
use sqlx::SqlitePool;
use crate::error::AppError;

pub async fn auth(
    State(_pool): State<SqlitePool>,
    jar: CookieJar,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Extract token from cookie
    let token = jar
        .get("token")
        .map(|cookie| cookie.value())
        .ok_or(AppError::Unauthorized)?;
    
    // Verify token
    let claims = super::jwt::verify_token(token)?;
    
    // Add user ID to request extensions
    request.extensions_mut().insert(claims.sub);
    
    // Continue to the next handler
    Ok(next.run(request).await)
}
