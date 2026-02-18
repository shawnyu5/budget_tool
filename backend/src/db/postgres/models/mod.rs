//! Data models for Postgres tables

/// Postgres data type representing a year
pub type Year = i32;
pub mod budget_allocation;
pub mod firefly;
pub mod month;
pub mod notification_key;
pub mod notification_subscription;
pub mod transaction;
pub mod user;
