use std::fs;

use anyhow::{Context, Result};
use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema};

use crate::tgtg::common::{
    Address, AverageOverallRating, Country, CoverPicture, Item, ItemPrice, ItemTag, ItemValue,
    Items, Location, LogoPicture, PickupInterval, PickupLocation, PriceExcludingTaxes,
    PriceIncludingTaxes, Store, StoreLocation, TaxAmount, ValueExcludingTaxes, ValueIncludingTaxes,
};

pub type SchemaType = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

/// Root of the graphql query
#[derive(Default, Clone)]
pub struct QueryRoot;

#[Object]
/// Root of the query
impl QueryRoot {
    /// Tgtg related queries
    async fn tgtg(&self) -> Tgtg {
        Tgtg::default()
    }
}

#[derive(Default, Clone)]
#[allow(dead_code)]
pub struct Tgtg {
    items: Items,
}

/// Tgtg related queries
#[Object]
impl Tgtg {
    /// Get tgtg items
    async fn items(&self) -> Items {
        Items {
            item: Item {
                item_id: "item123".to_string(),
                sales_taxes: vec![],
                tax_amount: TaxAmount {
                    code: "USD".to_string(),
                    minor_units: 0,
                    decimals: 2,
                },
                price_excluding_taxes: PriceExcludingTaxes {
                    code: "USD".to_string(),
                    minor_units: 500,
                    decimals: 2,
                },
                price_including_taxes: PriceIncludingTaxes {
                    code: "USD".to_string(),
                    minor_units: 550,
                    decimals: 2,
                },
                value_excluding_taxes: ValueExcludingTaxes {
                    code: "USD".to_string(),
                    minor_units: 500,
                    decimals: 2,
                },
                value_including_taxes: ValueIncludingTaxes {
                    code: "USD".to_string(),
                    minor_units: 550,
                    decimals: 2,
                },
                taxation_policy: "standard".to_string(),
                show_sales_taxes: true,
                item_price: ItemPrice {
                    code: "USD".to_string(),
                    minor_units: 500,
                    decimals: 2,
                },
                item_value: ItemValue {
                    code: "USD".to_string(),
                    minor_units: 500,
                    decimals: 2,
                },
                cover_picture: CoverPicture {
                    picture_id: "cover123".to_string(),
                    current_url: "https://example.com/cover.jpg".to_string(),
                    is_automatically_created: false,
                },
                logo_picture: LogoPicture {
                    picture_id: "logo123".to_string(),
                    current_url: "https://example.com/logo.jpg".to_string(),
                    is_automatically_created: false,
                },
                name: "Example Item".to_string(),
                description: "A test item for demonstration.".to_string(),
                subtitle: "Limited Edition".to_string(),
                food_handling_instructions: "Keep refrigerated.".to_string(),
                can_user_supply_packaging: true,
                packaging_option: "Reusable".to_string(),
                collection_info: "Pick up at front desk.".to_string(),
                diet_categories: vec![],
                item_category: "Food".to_string(),
                buffet: false,
                positive_rating_reasons: vec!["Tasty".to_string(), "Good Value".to_string()],
                average_overall_rating: AverageOverallRating {
                    average_overall_rating: 4.5,
                    rating_count: 123,
                    month_count: 6,
                    average_collection_experience_rating: 4.6,
                    average_food_quality_rating: 4.7,
                    average_contents_variety_rating: 4.4,
                    average_food_quantity_rating: 4.5,
                },
                favorite_count: 42,
            },
            store: Store {
                store_id: "store123".to_string(),
                store_name: "Example Store".to_string(),
                branch: "Main".to_string(),
                description: "A great store!".to_string(),
                tax_identifier: "TAX12345".to_string(),
                website: "https://example.com".to_string(),
                store_location: StoreLocation {
                    address: Address {
                        country: Country {
                            iso_code: "US".to_string(),
                            name: "United States".to_string(),
                        },
                        address_line: "123 Main St.".to_string(),
                        city: "Example City".to_string(),
                        postal_code: "12345".to_string(),
                    },
                    location: Location {
                        latitude: 37.7749,
                        longitude: -122.4194,
                    },
                },
                logo_picture: LogoPicture {
                    picture_id: "storelogo123".to_string(),
                    current_url: "https://example.com/storelogo.jpg".to_string(),
                    is_automatically_created: false,
                },
                store_time_zone: "America/Los_Angeles".to_string(),
                hidden: false,
                favorite_count: 100,
                distance: 3.5,
                cover_picture: CoverPicture {
                    picture_id: "storecover123".to_string(),
                    current_url: "https://example.com/storecover.jpg".to_string(),
                    is_automatically_created: false,
                },
                is_manufacturer: false,
            },
            display_name: "Sample Item Display Name".to_string(),
            pickup_interval: PickupInterval {
                start: "2025-06-08T10:00:00Z".to_string(),
                end: "2025-06-08T12:00:00Z".to_string(),
            },
            pickup_location: PickupLocation {
                address: Address {
                    country: Country {
                        iso_code: "US".to_string(),
                        name: "United States".to_string(),
                    },
                    address_line: "456 Pickup Ave.".to_string(),
                    city: "Pickup City".to_string(),
                    postal_code: "67890".to_string(),
                },
                location: Location {
                    latitude: 37.7750,
                    longitude: -122.4195,
                },
            },
            purchase_end: "2025-06-08T09:00:00Z".to_string(),
            items_available: 10,
            distance: 1.2,
            favorite: true,
            subscribed_to_notification: false,
            in_sales_window: true,
            new_item: false,
            item_type: "standard".to_string(),
            matches_filters: true,
            item_tags: vec![ItemTag {
                id: "tag1".to_string(),
                short_text: "Organic".to_string(),
                long_text: Some("Certified Organic Product.".to_string()),
                variant: "green".to_string(),
                description: Some("This item is certified organic.".to_string()),
                description_heading: Some("Organic Certification".to_string()),
            }],
        }
    }
}

/// Generate the graphql schema, and save it to a file
pub fn generate_graphql_schema() -> Result<Schema<QueryRoot, EmptyMutation, EmptySubscription>> {
    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish();

    fs::write("schema.graphql", schema.sdl()).context("Failed to write graphql schema to file")?;
    return Ok(schema);
}
