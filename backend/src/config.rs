use std::env;

use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use dotenvy::dotenv;

#[non_exhaustive]
#[derive(Debug)]
pub struct Config {
    pub db_connection_string: String,
    /// Name of the database
    pub database_name: String,
    /// Private key used to sign the JWT
    pub private_key: String,
    /// Base64 decoded credentials
    pub basic_auth: Vec<String>,
}

impl Config {
    pub fn load() -> Config {
        dotenv().ok();
        let basic_auth = env::var("basic_auth").unwrap_or_default();
        let basic_auth_vec = basic_auth
            .split(',')
            .map(|s| {
                let decoded = BASE64_STANDARD
                    .decode(s)
                    // Failing to decode user credentials is a fatal error
                    .expect("Failed to decode user from base64");
                String::from_utf8(decoded)
                    .expect("Failed to convert decoded user to string")
                    .replace("\n", "")
            })
            .collect();
        return Config {
            db_connection_string: env::var("db_connection_string")
                .expect("MIssing `db_connection_string` env var"),
            database_name: env::var("db_name").unwrap_or("budget_tool".to_string()),
            private_key: env::var("private_key")
                .expect("Missing `private_key` env var, used for JWT signing"),
            basic_auth: basic_auth_vec,
        };
    }
}
