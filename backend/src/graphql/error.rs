use async_graphql::{Enum, Error, ErrorExtensions, Object, Pos, Response, SimpleObject, Union};
use axum::{Json, response::IntoResponse};
use serde::Serialize;
use thiserror::Error;

#[derive(SimpleObject, Debug, Serialize)]
pub struct GraphQLErrorObject {
    pub code: GraphQLErrorCode,
    pub message: String,
}

/// GraphQL error codes
#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug, Error, Serialize)]
pub enum GraphQLErrorCode {
    /// Something went wrong on the server side. Typically response 500
    #[error("ServerError")]
    ServerError,

    /// Failed to fetch budget for some reason. Typically response 404
    #[error("Failed to fetch budget")]
    FailedToFetchBudget,

    #[error("Invalid Firefly API key")]
    InvalidFireflyAPIKey,
}

impl ErrorExtensions for GraphQLErrorCode {
    fn extend(&self) -> async_graphql::Error {
        self.extend_with(|err, e| match err {
            GraphQLErrorCode::ServerError => e.set("error", err.to_string()),
            GraphQLErrorCode::FailedToFetchBudget => e.set("error", err.to_string()),
            GraphQLErrorCode::InvalidFireflyAPIKey => e.set("error", err.to_string()),
        })
    }
}

impl IntoResponse for GraphQLErrorObject {
    fn into_response(self) -> axum::response::Response {
        let graphql_err = Error::new(self.message)
            .extend_with(|_, e| e.set("code", self.code))
            .into_server_error(Pos::default());
        let resp = Response::from_errors(vec![graphql_err]);
        return Json(resp).into_response();
    }
}
