use axum_test::TestServer;
use backend::routes::{app, auth::generate_jwt};
use simd_json::{derived::ValueObjectAccessAsObject, json, OwnedValue};

#[tokio::test]
async fn test_version_route() {
    let server = TestServer::new(app().await).unwrap();
    let resp = server.get("/").await;
    resp.assert_status_ok();
}

#[tokio::test]
async fn test_query_monthly_budget() {
    let mut server = TestServer::new(app().await).unwrap();
    let body = json!( {
        "query": r#"query {
                monthlyBudget(year: 2025, month: June) {
                    ... on MonthlyBudget {
                        totalSpending
                    }
                    ...on GraphQLErrorObject {
                        message
                    }
                }
        }"#
    });
    dbg!(&body);
    server.add_header(
        "authorization",
        format!("Bearer {}", generate_jwt("integration-test")),
    );
    dbg!(&server);

    let resp = server.post("/graphql").json(&body).await;
    resp.assert_status_ok();
    let resp_json: OwnedValue = resp.json();
    assert!(
        resp_json.get_object("errors").is_none(),
        "GraphQL query should not produce error"
    );
}

