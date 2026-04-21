use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow, Debug)]
pub struct FireflyTransactionRow {
    pub id: Uuid,
    /// The user this transaction is associated with
    ///
    /// FK to user.id
    ///
    /// To remain backwards compatible, this value is set as optional. If this is empty, the firefly API will be used to determine the owner of a Firefly transaction
    pub user_id: Option<Uuid>,
    /// The transaction ID this Firefly transaction is tied to
    /// FK to transactions.id
    pub transaction_id: Uuid,
    /// ID of the transaction in Firefly
    pub firefly_id: String,
    /// Link to the transaction in Firefly
    pub firefly_link: String,
}
