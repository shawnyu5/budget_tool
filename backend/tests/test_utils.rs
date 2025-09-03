use axum_test::TestServer;
use backend::routes::auth::generate_jwt;

/// Adds a JWT header to a test server
///
/// * `server`: the test server
pub fn add_jwt_header(mut server: TestServer) -> TestServer {
    server.add_header(
        "authorization",
        format!("Bearer {}", generate_jwt("integration-test")),
    );
    return server;
}
