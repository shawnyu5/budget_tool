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
- `encryption_key`: key used for encryption / decryption. It must be 32 characters long
- `vapid_public_key`: VAPID public key used to sign the notification by the client
- `vapid_private_key`: VAPID private key used to verify notifications from the client
- `DATABASE_URL`: Postgres DB url, in the format `postgres://<username>:<password>@<port>/budget_tool_dev`

The VAPID keys can be generated using the following JS:

```js
const webpush = require("web-push");
const vapidKeys = webpush.generateVAPIDKeys();

console.log("Public Key:", vapidKeys.publicKey); // base64url (65 bytes)
console.log("Private Key:", vapidKeys.privateKey); // base64url
```

## Data models

See [dbdoc/README.md](./dbdoc/README.md).

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
  - There just leaves "head room" for other transactions to be split according to the allocated budget
