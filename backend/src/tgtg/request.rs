use reqwest::header::COOKIE;
use reqwest::header::USER_AGENT;
use reqwest::Client;
use serde::Deserialize;
use serde::Serialize;
use simd_json::OwnedValue;

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

async fn get_items() {
    let url = "https://apptoogoodtogo.com/api/item/v8/";
    let cookie = "datadome=Ano3E0to3wYDAOxws9DoeaSvbBbzX9Nm3e_XHXZtR3nldruE3rEpNwgtZQPUrDuWB2WNzk9IBYe2CHRoxNYR4ofJ1feVW7Mzi~ogunfET7lY7SH5HQQbxpoMPXfquaqK";
    let response = Client::new().post(url).header(
        USER_AGENT,
        "TooGoodToGo/25.5.10 (543.0) (iPhone/iPhone 13; iOS 18.5; Scale/3.00/iOS)",
    )
        .header(COOKIE, cookie)
        .bearer_auth("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDkyNDY3MTgsImlhdCI6MTc0OTA3MzkxOCwiaXNzIjoidGd0Z19zb3RlcmlhIiwidCI6InFMMmhQNTE3UmUtay1ROVdDMnRHMUE6MToxIiwic3ViIjoiMTE5OTc4ODU4In0.E1Fy7uXVtHOgZL2S7sT-IsKVmuDm4TxNBIyn-KsMPVQ").send().await.unwrap();
    dbg!(&response.text().await);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_items() {
        get_items().await;
    }
}
