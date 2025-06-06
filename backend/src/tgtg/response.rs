use super::common::Items;
use async_graphql::SimpleObject;
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;

/// Response body for list of items
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct TGTGItems {
    pub items: Vec<Items>,
    #[serde(rename = "items_expanded_radius")]
    pub items_expanded_radius: Vec<Value>,
}
