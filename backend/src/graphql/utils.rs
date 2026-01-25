use anyhow::Result as AnyhowResult;
use anyhow::anyhow;
use async_graphql::{Context, Guard, Result};
use tracing::error;
use tracing::instrument;

use crate::routes::{JwtClaim, MaybeJwt};

/// Validates the JWT is still valid
pub struct AuthGuard;

impl Guard for AuthGuard {
    #[instrument(skip_all)]
    async fn check(&self, ctx: &Context<'_>) -> Result<()> {
        let jwt = ctx.data::<MaybeJwt>().unwrap();
        if jwt.is_none() {
            error!("Returning UNAUTHENTICATED");
            return Err("UNAUTHENTICATED".into());
        }
        return Ok(());
    }
}

/// Extract the JWT from graphql context
pub fn extract_jwt(ctx: &Context<'_>) -> AnyhowResult<JwtClaim> {
    let maybe_jwt = match ctx.data::<MaybeJwt>() {
        Ok(jwt) => jwt,
        Err(e) => {
            error!("Missing JWT in graphql context: {:?}", e);
            // return Err(GraphQLErrorObject {
            //     code: crate::graphql::error::GraphQLErrorCode::Forbidden,
            //     message: "Missing or invalid JWT token".to_owned(),
            // });
            return Err(anyhow!("Missing JWT in graphql context"));
        }
    };

    if maybe_jwt.is_none() {
        // return Err(GraphQLErrorObject {
        //     code: super::error::GraphQLErrorCode::Forbidden,
        //     message: "Missing or invalid JWT token".to_owned(),
        // });
        return Err(anyhow!("No JWT found"));
    }

    return Ok(maybe_jwt.0.clone().unwrap());
}
