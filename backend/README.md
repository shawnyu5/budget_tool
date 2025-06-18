# Backend

This is an Http server that exposes a REST and GraphQL API to manage budgeting.

## Setup

The following environment variables are required:

- `basic_auth`: base 64 encoded user name / password, in the format `<user name>:<password>`. This can contain a comma separated list of values
- `db_connection_string`: Mongo DB connection string. The DB user must have read write permission
- `db_name`: the specific DB we are targeting
- `private_key`: private key used for JWT auth
- `vapid_public_key`: VAPID public key used to sign the notification by the client
- `vapid_private_key`: VAPID private key used to verify notifications from the client
