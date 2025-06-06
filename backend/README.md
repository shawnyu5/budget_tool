# Backend

This is an Http server that exposes a REST API to manage budgeting.

## Setup

The following environment variables are required:

- `basic_auth`: base 64 encoded user name / password, in the format `<user name>:<password>`
- `db_connection_string`: Mongo DB connection string. The DB user must have read write permission
- `db_name`: the specific DB we are targeting
- `private_key`: private key used for JWT auth
