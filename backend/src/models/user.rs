use serde::{Deserialize, Serialize};
use crate::db::models::DbUser;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub username: String,
    pub role: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

impl From<DbUser> for User {
    fn from(db_user: DbUser) -> Self {
        Self {
            id: db_user.id,
            email: db_user.email,
            username: db_user.username,
            role: db_user.role,
            created_at: db_user.created_at,
        }
    }
}
