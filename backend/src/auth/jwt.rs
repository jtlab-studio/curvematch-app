use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i64,  // user id
    pub exp: i64,  // expiration time
    pub iat: i64,  // issued at
}

pub fn create_token(user_id: i64) -> Result<String, AppError> {
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "default-secret-change-in-production".to_string());
    
    let now = Utc::now();
    let expires_at = now + Duration::days(7);
    
    let claims = Claims {
        sub: user_id,
        exp: expires_at.timestamp(),
        iat: now.timestamp(),
    };
    
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )?;
    
    Ok(token)
}

pub fn verify_token(token: &str) -> Result<Claims, AppError> {
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "default-secret-change-in-production".to_string());
    
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )?;
    
    Ok(token_data.claims)
}
