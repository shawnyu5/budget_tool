use sqlx::prelude::FromRow;
use uuid::Uuid;

use crate::{db::postgres::models::Year, month::Month};

/// Stores budget information for a single month
#[derive(Debug, FromRow)]
pub struct MonthRow {
    /// Primary key
    pub id: Uuid,
    /// The year this month is in
    pub year: Year,
    /// Numeric representation of the Month
    pub month: Month,
}
