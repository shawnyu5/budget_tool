use std::env;

use dotenvy::dotenv;

pub struct Config {
    pub db_connection_string: String,
    pub database_name: String,
}

impl Config {
    pub fn load() -> Config {
        dotenv().ok();
        return Config {
            db_connection_string: env::var("db_connection_string")
                .expect("MIssing `db_connection_string` env var"),
            database_name: env::var("db_name").unwrap_or("budget_tool".to_string()),
        };
    }
}
