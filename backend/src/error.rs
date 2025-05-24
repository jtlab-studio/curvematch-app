use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    // Authentication errors
    Unauthorized,
    Forbidden,
    
    // Database errors
    DatabaseError(sqlx::Error),
    
    // Validation errors
    BadRequest(String),
    
    // Not found
    NotFound(String),
    
    // Internal errors
    InternalServerError(anyhow::Error),
    
    // File handling errors
    FileError(String),
    
    // Matching errors
    MatchingError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Unauthorized => write!(f, "Unauthorized"),
            AppError::Forbidden => write!(f, "Forbidden"),
            AppError::DatabaseError(e) => write!(f, "Database error: {}", e),
            AppError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::InternalServerError(e) => write!(f, "Internal server error: {}", e),
            AppError::FileError(msg) => write!(f, "File error: {}", msg),
            AppError::MatchingError(msg) => write!(f, "Matching error: {}", msg),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden"),
            AppError::DatabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::BadRequest(ref msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::NotFound(ref msg) => (StatusCode::NOT_FOUND, msg.as_str()),
            AppError::InternalServerError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
            AppError::FileError(ref msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::MatchingError(ref msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.as_str()),
        };

        let body = Json(json!({
            "error": error_message,
        }));

        (status, body).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseError(err)
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalServerError(err)
    }
}

impl From<bcrypt::BcryptError> for AppError {
    fn from(_: bcrypt::BcryptError) -> Self {
        AppError::InternalServerError(anyhow::anyhow!("Password hashing error"))
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(_: jsonwebtoken::errors::Error) -> Self {
        AppError::Unauthorized
    }
}
