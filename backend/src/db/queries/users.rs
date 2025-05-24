use sqlx::SqlitePool;
use crate::db::models::DbUser;
use crate::error::AppError;

pub async fn create_user(
    pool: &SqlitePool,
    email: &str,
    username: &str,
    password_salt: &str,
    password_hash: &str,
) -> Result<DbUser, AppError> {
    let result = sqlx::query_as::<_, DbUser>(
        r#"
        INSERT INTO users (email, username, password_salt, password_hash)
        VALUES (?1, ?2, ?3, ?4)
        RETURNING *
        "#,
    )
    .bind(email)
    .bind(username)
    .bind(password_salt)
    .bind(password_hash)
    .fetch_one(pool)
    .await?;
    
    Ok(result)
}

pub async fn find_user_by_email(
    pool: &SqlitePool,
    email: &str,
) -> Result<Option<DbUser>, AppError> {
    let result = sqlx::query_as::<_, DbUser>(
        r#"
        SELECT * FROM users WHERE email = ?1
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;
    
    Ok(result)
}

pub async fn find_user_by_id(
    pool: &SqlitePool,
    id: i64,
) -> Result<Option<DbUser>, AppError> {
    let result = sqlx::query_as::<_, DbUser>(
        r#"
        SELECT * FROM users WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    Ok(result)
}
