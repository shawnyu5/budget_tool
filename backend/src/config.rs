use std::env;

use async_graphql::SimpleObject;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use dotenvy::dotenv;

#[non_exhaustive]
#[derive(Debug, SimpleObject)]
pub struct Config {
    pub db_connection_string: String,
    /// Name of the database
    pub database_name: String,
    /// Private key used for decryption
    pub private_key: String,
    /// Public key used for encryption
    pub public_key: String,
    /// Base64 encoded credentials
    pub basic_auth: Vec<String>,
    /// VAPID public key used to sign notifications by the client
    pub vapid_public_key: String,
    /// VAPID private key used to verify notifications sent by the client
    pub vapid_private_key: String,
}

impl Config {
    /// Load server configuration. This function will panic if anything goes wrong. We can not start the application with missing / invalid configuration
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
            public_key: env::var("public_key").expect("Missing public_key"),
            basic_auth: basic_auth_vec,
            vapid_public_key: env::var("vapid_public_key")
                .expect("Missing vapid_public_key env var. Used for client notification signing"),
            vapid_private_key: env::var("vapid_private_key").expect(
                "Missing vapid_private_key env var. Used for server notification verification",
            ),
        };
    }
}
