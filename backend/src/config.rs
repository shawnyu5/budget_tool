use std::env;

use dotenvy::dotenv;

pub struct Config {
    pub db_connection_string: String,
}

impl Config {
    pub fn load() -> Config {
        dotenv().ok();
        return Config {
            db_connection_string: env::var("db_connection_string").unwrap(),
        };
    }
}
