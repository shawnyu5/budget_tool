use anyhow::{Context as _, Result};
use async_graphql::{Context, InputObject, SimpleObject};

use crate::{
    db::{
        MongoDB,
        users::{USER_TABLE_NAME, User},
    },
    graphql::utils::extract_jwt,
};

#[derive(InputObject)]
pub struct UpdateMe {
    pub user: User,
}

#[derive(SimpleObject)]
pub struct UpdateMeResponse {
    pub success: bool,
}

pub async fn update_me_handler(ctx: &Context<'_>, inputs: UpdateMe) -> Result<UpdateMeResponse> {
    let jwt = extract_jwt(ctx)?;
    let db = MongoDB::new(USER_TABLE_NAME).await?;
    let _ = db
        .save_user_info(&jwt.username, &inputs.user)
        .await
        .context("Failed to update user information")?;
    return Ok(UpdateMeResponse { success: true });
}
