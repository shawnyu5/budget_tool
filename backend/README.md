# Backend

<!--toc:start-->

- [Backend](#backend)
  - [Setup](#setup)
  - [Data models](#data-models)
  <!--toc:end-->

This is an Http server that exposes a REST and GraphQL API to manage budgeting.

## Setup

The following environment variables are required:

- `basic_auth`: base 64 encoded user name / password, in the format `<user name>:<password>`. This can contain a comma separated list of values
- `db_connection_string`: Mongo DB connection string. The DB user must have read write permission
- `db_name`: the specific DB we are targeting
- `private_key`: private key used for JWT auth
- `encryption_key`: key used for encryption / decryption
- `vapid_public_key`: VAPID public key used to sign the notification by the client
- `vapid_private_key`: VAPID private key used to verify notifications from the client

The VAPID keys can be generated using the following JS:

```js
const webpush = require("web-push");
const vapidKeys = webpush.generateVAPIDKeys();

console.log("Public Key:", vapidKeys.publicKey); // base64url (65 bytes)
console.log("Private Key:", vapidKeys.privateKey); // base64url
```

## Data models

Postgres data models:

`months`

Stores budget information about a single month

| Name                                                                        | Type          | Description                            | Relationship | Notes      |
| --------------------------------------------------------------------------- | ------------- | -------------------------------------- | ------------ | ---------- |
| ID                                                                          | UUID          |                                        | PK           |            |
| year                                                                        | INT           | The year this month is associated with |              | Unique     |
| month                                                                       | INT           | Numeric representation of the Month    |              | Unique     |
| ~~total_allocation~~ Remove this, calculate using sql query on the fly      | DECIMAL(10,2) | Total allocated spending               |              |            |
| ~~total_spending~~ Remove this, and calcuate this using sql query statement | DECIMAL(10,2) | Total spending for the month           |              | Default: 0 |
| ~~over_budget_amount~~ Remove this and calculate at run time                | DECIMAL(10,2) | Over budget amount for the month       |              | Default: 0 |

`budget_allocations`

| Name                  | Type          | Description                          | Relationship | Notes |
| --------------------- | ------------- | ------------------------------------ | ------------ | ----- |
| ID                    | UUID          |                                      | PK           |       |
| month_id              | UUID          | The month this allocation is for     | months(id)   |       |
| user_id               | UUID NOT NULL | User ID of the contributor           | user(id)     |       |
| percentage_allocation | DECIMAL(10,2) | Percentage allocation                |              |       |
| contribution amount   | DECIMAL(10,2) | Amount of contribution for the month |              |       |

`transactions`

Stores all transactions

| Name        | Type                | Description                            | Relationship | Notes |
| ----------- | ------------------- | -------------------------------------- | ------------ | ----- |
| ID          | UUID                |                                        | PK           |       |
| month_id    | UUID                | The month this transactions is tied to | months(id)   |       |
| amount      | DECIMAL(10,2)       | Amount of the transaction              |              |       |
| date        | TIMESTAMPZ NOT NULL |                                        |              |       |
| description | TEXT                |                                        |              |       |
| notes       | TEXT                |                                        |              |       |

`users`

Stores all user information

| Name | Type | Description | Relationship | Notes |
| -------- | ---- | -------------------------------------- | ------------ | ----- | | ID | UUID | | PK | |
| username | TEXT | The month this transactions is tied to | months(id) | |

`firefly`

Stores all firefly configuration

| Name              | Type | Description                                         | Relationship | Notes |
| ----------------- | ---- | --------------------------------------------------- | ------------ | ----- |
| ID                | UUID |                                                     | PK           |       |
| user_id           | UUID | The user this firefly config is tied to             | users(id)    |       |
| enabled           | bool | Whether the firefly integration is enabled          |              |       |
| api_key           | bool | Encrypted firefly API key                           |              |       |
| encryption_nounce | TEXT | Encryption nounce used to encrypt / decrypt API key |              |       |
| source_account    | TEXT | Source account to store firefly transactions in     |              |       |

`notification_subscription`

Store user notification subscription

| Name            | Type | Description                                        | Relationship | Notes    |
| --------------- | ---- | -------------------------------------------------- | ------------ | -------- |
| ID              | UUID |                                                    | PK           |          |
| user_id         | UUID | The user this notification subscription is tied to | users(id)    |          |
| endpoint        | TEXT | The endpoint to send the notification              |              |          |
| expiration_time | DATE |                                                    |              | Optional |

`notification_keys`

Stores auth keys for a user

| Name    | Type | Description                               | Relationship | Notes |
| ------- | ---- | ----------------------------------------- | ------------ | ----- |
| ID      | UUID |                                           | PK           |       |
| user_id | UUID | The user this notification key is tied to | users(id)    |       |
| auth    | TEXT | Auth key                                  |              |       |
| p256dh  | TEXT |                                           |              |       |

## Adding a transaction

Defines rules for adding transaction:

- If current month is **not** over budget:
  - Add a new entry in `transactions` table
  - Set `transaction.split_mode` = `from_settings`
- If adding current transaction **will go over budget**:
  - Split transaction being added into 2
  - Transaction 1 amount will be amount that can still fit within budget. Set `transaction.split_mode` to `from_settings`
  - Transaction 2 (overflow transaction) will contain the rest of the amount. Set `transaction.split_mode` to `evenly`
- If current month **is** over budget:
  - Add a new entry in `transactions` table
  - Set `transaction.split_mode` = `evenly`
- When a transaction is deleted, the `transaction.split_mode` is not re computed for existing transactions
    * There just leaves "head room" for other transactions to be split according to the allocated budget
