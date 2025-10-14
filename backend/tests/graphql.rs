mod test_utils;

use axum_test::TestServer;
use backend::routes::app;
use simd_json::{derived::ValueObjectAccessAsArray, json, OwnedValue};
use test_utils::add_jwt_header;

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

    server = add_jwt_header(server);
    let resp = server.post("/graphql").json(&body).await;
    resp.assert_status_ok();
    let resp_json: OwnedValue = resp.json();
    assert!(
        resp_json.get_array("errors").is_none(),
        "GraphQL query should not produce error"
    );
}

#[tokio::test]
async fn test_update_budget_config() {
    let mut server = TestServer::new(app().await).unwrap();
    let body = json!( {
        "query": r#"mutation {
            updateBudgetConfig(
                inputs: {
                    year: "2025"
                    month: June
                    budgetConfig: {
                        totalAllocation: 100
                        shawnPercentageAllocation: 50
                        shawnContributionAmount: 50
                        maggiePercentageAllocation: 50
                        maggieContributionAmount: 50
                    }
                }
            ) {
                ... on BudgetConfig {
                    totalAllocation
                }
                ...on GraphQLErrorObject {
                    message
                }
            }
        }"#
    });
    server = add_jwt_header(server);
    let resp = server.post("/graphql").json(&body).await;
    resp.assert_status_ok();
    dbg!(&resp);
    let resp_json: OwnedValue = resp.json();
    assert!(
        resp_json.get_array("errors").is_none(),
        "GraphQL query should not produce error"
    );
}
