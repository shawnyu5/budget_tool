use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow)]
pub struct FireflyTransactionRow {
    pub id: Uuid,
    /// The transaction ID this Firefly transaction is tied to
    /// FK to transactions.id
    pub transaction_id: Uuid,
    /// ID of the transaction in Firefly
    pub firefly_id: String,
    /// Link to the transaction in Firefly
    pub firefly_link: String,
}
