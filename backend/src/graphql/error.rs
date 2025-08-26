use async_graphql::{Enum, ErrorExtensions, Object, SimpleObject, Union};
use thiserror::Error;

#[derive(SimpleObject, Debug)]
pub struct GraphQLErrorObject {
    pub code: GraphQLErrorCode,
    pub message: String,
}

/// GraphQL error codes
#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug, Error)]
pub enum GraphQLErrorCode {
    /// When the user does not have the authorization
    #[error("Not authorized")]
    Forbidden,

    /// Something went wrong on the server side. Typically response 500
    #[error("ServerError")]
    ServerError,

    /// Failed to fetch budget for some reason. Typically response 404
    #[error("Failed to fetch budget")]
    FailedToFetchBudget,
}

impl ErrorExtensions for GraphQLErrorCode {
    fn extend(&self) -> async_graphql::Error {
        self.extend_with(|err, e| match err {
            GraphQLErrorCode::Forbidden => e.set("code", "FORBIDDEN"),
            GraphQLErrorCode::ServerError => e.set("error", err.to_string()),
            GraphQLErrorCode::FailedToFetchBudget => e.set("error", err.to_string()),
        })
    }
}

pub struct Circle {
    pub radius: f32,
}

#[Object]
impl Circle {
    async fn area(&self) -> f32 {
        std::f32::consts::PI * self.radius * self.radius
    }

    async fn scale(&self, s: f32) -> Shape {
        Circle {
            radius: self.radius * s,
        }
        .into()
    }
}

pub struct Square {
    pub width: f32,
}

#[Object]
impl Square {
    async fn area(&self) -> f32 {
        self.width * self.width
    }

    async fn scale(&self, s: f32) -> Shape {
        Square {
            width: self.width * s,
        }
        .into()
    }
}

#[derive(Union)]
pub enum Shape {
    Circle(Circle),
    Square(Square),
}
