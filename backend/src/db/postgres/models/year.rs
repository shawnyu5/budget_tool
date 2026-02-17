use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow)]
pub struct Year {
    pub id: Uuid,
    pub year: i16,
}
