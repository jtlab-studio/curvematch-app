use bcrypt::{hash, verify, DEFAULT_COST};
use rand::Rng;
use crate::error::AppError;

pub fn hash_password(password: &str) -> Result<(String, String), AppError> {
    // Generate random salt
    let mut rng = rand::thread_rng();
    let salt: String = (0..16)
        .map(|_| {
            let idx = rng.gen_range(0..62);
            let chars = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            chars[idx] as char
        })
        .collect();
    
    // Hash password with bcrypt
    let hashed = hash(password, DEFAULT_COST)?;
    
    Ok((salt, hashed))
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    Ok(verify(password, hash)?)
}
