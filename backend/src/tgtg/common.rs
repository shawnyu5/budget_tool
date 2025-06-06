use async_graphql::SimpleObject;
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Origin {
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
pub struct PickupInterval {
    pub end: String,
    pub start: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Items {
    pub item: Item,
    pub store: Store,
    #[serde(rename = "display_name")]
    pub display_name: String,
    #[serde(rename = "pickup_interval")]
    pub pickup_interval: PickupInterval,
    #[serde(rename = "pickup_location")]
    pub pickup_location: PickupLocation,
    #[serde(rename = "purchase_end")]
    pub purchase_end: String,
    #[serde(rename = "items_available")]
    pub items_available: i64,
    pub distance: f64,
    pub favorite: bool,
    #[serde(rename = "subscribed_to_notification")]
    pub subscribed_to_notification: bool,
    #[serde(rename = "in_sales_window")]
    pub in_sales_window: bool,
    #[serde(rename = "new_item")]
    pub new_item: bool,
    #[serde(rename = "item_type")]
    pub item_type: String,
    #[serde(rename = "matches_filters")]
    pub matches_filters: bool,
    #[serde(rename = "item_tags")]
    pub item_tags: Vec<ItemTag>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    #[serde(rename = "item_id")]
    pub item_id: String,
    #[serde(rename = "sales_taxes")]
    pub sales_taxes: Vec<SalesTax>,
    #[serde(rename = "tax_amount")]
    pub tax_amount: TaxAmount,
    #[serde(rename = "price_excluding_taxes")]
    pub price_excluding_taxes: PriceExcludingTaxes,
    #[serde(rename = "price_including_taxes")]
    pub price_including_taxes: PriceIncludingTaxes,
    #[serde(rename = "value_excluding_taxes")]
    pub value_excluding_taxes: ValueExcludingTaxes,
    #[serde(rename = "value_including_taxes")]
    pub value_including_taxes: ValueIncludingTaxes,
    #[serde(rename = "taxation_policy")]
    pub taxation_policy: String,
    #[serde(rename = "show_sales_taxes")]
    pub show_sales_taxes: bool,
    #[serde(rename = "item_price")]
    pub item_price: ItemPrice,
    #[serde(rename = "item_value")]
    pub item_value: ItemValue,
    #[serde(rename = "cover_picture")]
    pub cover_picture: CoverPicture,
    #[serde(rename = "logo_picture")]
    pub logo_picture: LogoPicture,
    pub name: String,
    pub description: String,
    pub subtitle: String,
    #[serde(rename = "food_handling_instructions")]
    pub food_handling_instructions: String,
    #[serde(rename = "can_user_supply_packaging")]
    pub can_user_supply_packaging: bool,
    #[serde(rename = "packaging_option")]
    pub packaging_option: String,
    #[serde(rename = "collection_info")]
    pub collection_info: String,
    #[serde(rename = "diet_categories")]
    pub diet_categories: Vec<Value>,
    #[serde(rename = "item_category")]
    pub item_category: String,
    pub buffet: bool,
    #[serde(rename = "positive_rating_reasons")]
    pub positive_rating_reasons: Vec<String>,
    #[serde(rename = "average_overall_rating")]
    pub average_overall_rating: AverageOverallRating,
    #[serde(rename = "favorite_count")]
    pub favorite_count: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct SalesTax {
    #[serde(rename = "tax_description")]
    pub tax_description: String,
    #[serde(rename = "tax_percentage")]
    pub tax_percentage: f64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct TaxAmount {
    pub code: String,
    #[serde(rename = "minor_units")]
    pub minor_units: i64,
    pub decimals: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct PriceExcludingTaxes {
    pub code: String,
    #[serde(rename = "minor_units")]
    pub minor_units: i64,
    pub decimals: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct PriceIncludingTaxes {
    pub code: String,
    #[serde(rename = "minor_units")]
    pub minor_units: i64,
    pub decimals: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct ValueExcludingTaxes {
    pub code: String,
    #[serde(rename = "minor_units")]
    pub minor_units: i64,
    pub decimals: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct ValueIncludingTaxes {
    pub code: String,
    #[serde(rename = "minor_units")]
    pub minor_units: i64,
    pub decimals: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct ItemPrice {
    pub code: String,
    #[serde(rename = "minor_units")]
    pub minor_units: i64,
    pub decimals: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct ItemValue {
    pub code: String,
    #[serde(rename = "minor_units")]
    pub minor_units: i64,
    pub decimals: i64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct CoverPicture {
    #[serde(rename = "picture_id")]
    pub picture_id: String,
    #[serde(rename = "current_url")]
    pub current_url: String,
    #[serde(rename = "is_automatically_created")]
    pub is_automatically_created: bool,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct LogoPicture {
    #[serde(rename = "picture_id")]
    pub picture_id: String,
    #[serde(rename = "current_url")]
    pub current_url: String,
    #[serde(rename = "is_automatically_created")]
    pub is_automatically_created: bool,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct AverageOverallRating {
    #[serde(rename = "average_overall_rating")]
    pub average_overall_rating: f64,
    #[serde(rename = "rating_count")]
    pub rating_count: i64,
    #[serde(rename = "month_count")]
    pub month_count: i64,
    #[serde(rename = "average_collection_experience_rating")]
    pub average_collection_experience_rating: f64,
    #[serde(rename = "average_food_quality_rating")]
    pub average_food_quality_rating: f64,
    #[serde(rename = "average_contents_variety_rating")]
    pub average_contents_variety_rating: f64,
    #[serde(rename = "average_food_quantity_rating")]
    pub average_food_quantity_rating: f64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Store {
    #[serde(rename = "store_id")]
    pub store_id: String,
    #[serde(rename = "store_name")]
    pub store_name: String,
    pub branch: String,
    pub description: String,
    #[serde(rename = "tax_identifier")]
    pub tax_identifier: String,
    pub website: String,
    #[serde(rename = "store_location")]
    pub store_location: StoreLocation,
    #[serde(rename = "logo_picture")]
    pub logo_picture: LogoPicture,
    #[serde(rename = "store_time_zone")]
    pub store_time_zone: String,
    pub hidden: bool,
    #[serde(rename = "favorite_count")]
    pub favorite_count: i64,
    pub distance: f64,
    #[serde(rename = "cover_picture")]
    pub cover_picture: CoverPicture,
    #[serde(rename = "is_manufacturer")]
    pub is_manufacturer: bool,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct StoreLocation {
    pub address: Address,
    pub location: Location,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Address {
    pub country: Country,
    #[serde(rename = "address_line")]
    pub address_line: String,
    pub city: String,
    #[serde(rename = "postal_code")]
    pub postal_code: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Country {
    #[serde(rename = "iso_code")]
    pub iso_code: String,
    pub name: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct Location {
    pub longitude: f64,
    pub latitude: f64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct PickupLocation {
    pub address: Address,
    pub location: Location,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, SimpleObject)]
#[serde(rename_all = "camelCase")]
pub struct ItemTag {
    pub id: String,
    #[serde(rename = "short_text")]
    pub short_text: String,
    #[serde(rename = "long_text")]
    pub long_text: Option<String>,
    pub variant: String,
    pub description: Option<String>,
    #[serde(rename = "description_heading")]
    pub description_heading: Option<String>,
}
