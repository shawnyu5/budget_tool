# Backend

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

`years`

| Name | Type | Relationship |
| ---- | ---- | ------------ |
| ID   | UUID | PK           |
| year | Int  |              |

`months`

Stores budget information about a single month

| Name               | Type          | Description                            | Relationship | Notes      |
| ------------------ | ------------- | -------------------------------------- | ------------ | ---------- |
| ID                 | UUID          |                                        | PK           |            |
| year_id            | UUID          | The year this month is associated with | years(ID)    | Unique     |
| month_name         | TEXT          | Name of the month                      |              | Unique     |
| total_allocation   | DECIMAL(10,2) | Total allocated spending               |              |            |
| total_spending     | DECIMAL(10,2) | Total spending for the month           |              | Default: 0 |
| over_budget_amount | DECIMAL(10,2) | Over budget amount for the month       |              | Default: 0 |

`budget_allocations`

| Name                  | Type          | Description                          | Relationship | Notes |
| --------------------- | ------------- | ------------------------------------ | ------------ | ----- |
| ID                    | UUID          |                                      | PK           |       |
| month_id              | UUID          | The month this allocation is for     | months(id)   |       |
| contributor_name      | TEXT          | Name of the contributor              |              |       |
| percentage_allocation | DECIMAL(10,2) | Percentage allocation                |              |       |
| contriubtion amount   | DECIMAL(10,2) | Amount of contribution for the month |              |       |

`transactions`

Stores all transactions

| Name        | Type          | Description                            | Relationship | Notes |
| ----------- | ------------- | -------------------------------------- | ------------ | ----- |
| ID          | UUID          |                                        | PK           |       |
| month_id    | UUID          | The month this transactions is tied to | months(id)   |       |
| amount      | DECIMAL(10,2) | Amount of the transaction              |              |       |
| date        | DATE          |                                        |              |       |
| description | TEXT          |                                        |              |       |
| notes       | TEXT          |                                        |              |       |

`users`

Stores all user information

| Name     | Type | Description                            | Relationship | Notes |
| -------- | ---- | -------------------------------------- | ------------ | ----- |
| ID       | UUID |                                        | PK           |       |
| username | TEXT | The month this transactions is tied to | months(id)   |       |

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
