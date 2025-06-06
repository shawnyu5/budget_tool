use serde::Deserialize;
use serde::Serialize;
use simd_json::OwnedValue;

use super::common::Items;
use super::common::Origin;
use super::common::PickupInterval;

/// Request body for list of items
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ItemsRequest {
    pub item_categories: Vec<OwnedValue>,
    pub favorites_only: bool,
    pub search_phrase: String,
    pub page_size: i64,
    pub sort_option: String,
    pub discover: bool,
    pub origin: Origin,
    pub radius: i64,
    pub page: i64,
    pub with_stock_only: bool,
    pub hidden_only: bool,
    pub diet_categories: Vec<OwnedValue>,
    pub pickup_intervals: Vec<PickupInterval>,
}
