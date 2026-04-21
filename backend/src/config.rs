use std::env;

use async_graphql::SimpleObject;
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use dotenvy::dotenv;
use serde::Serialize;
use validator::Validate;

#[non_exhaustive]
#[derive(Debug, SimpleObject, Validate)]
pub struct Config {
    pub db_connection_string: String,
    /// URL of the postgres DB
    pub postgres_url: String,
    /// Name of the database
    pub database_name: String,
    /// Private key used for decryption
    pub private_key: String,
    /// Public key used for encryption
    pub public_key: String,
    /// decoded credentials, where each item is a `username:password` pair
    pub basic_auth: Vec<BasicAuth>,
    /// Key used for encryption / decryption
    #[validate(length(equal = 32))]
    pub encryption_key: String,
    /// VAPID public key used to sign notifications by the client
    pub vapid_public_key: String,
    /// VAPID private key used to verify notifications sent by the client
    pub vapid_private_key: String,
    /// URL to firefly instance
    pub firefly_url: String,
}

/// Represent a basic auth with username / password pair
#[derive(Debug, SimpleObject, Clone)]
pub struct BasicAuth {
    pub username: String,
    pub password: String,
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

                let s = String::from_utf8(decoded)
                    .expect("Failed to convert decoded user to string")
                    .replace("\n", "");

                let (username, password) = s
                    .split_once(":")
                    .expect("Invalid format. Expected `username:password`");

                BasicAuth {
                    username: username.to_string(),
                    password: password.to_string(),
                }
            })
            .collect();
        let config = Config {
            postgres_url: env::var("DATABASE_URL")
                .expect("Missing postgres DB URL in `DATABASE_URL` environment variable"),
            firefly_url: "https://firefly.shawnyu.ca".to_string(),
            db_connection_string: env::var("db_connection_string")
                .expect("MIssing `db_connection_string` env var"),
            database_name: env::var("db_name").unwrap_or("budget_tool".to_string()),
            private_key: env::var("private_key")
                .expect("Missing `private_key` env var, used for JWT signing"),
            public_key: env::var("public_key").expect("Missing public_key"),
            basic_auth: basic_auth_vec,
            encryption_key: env::var("encryption_key")
                .expect("Missing `encryption_key` env var")
                .to_string(),
            vapid_public_key: env::var("vapid_public_key")
                .expect("Missing vapid_public_key env var. Used for client notification signing"),
            vapid_private_key: env::var("vapid_private_key").expect(
                "Missing vapid_private_key env var. Used for server notification verification",
            ),
        };
        config.validate().expect("Failed to validate config");
        config
    }
}
