-- Add migration script here
-- Create initial database schema
CREATE TABLE years (
    id UUID PRIMARY KEY,
    year INT NOT NULL UNIQUE
);

CREATE TABLE months (
    id UUID PRIMARY KEY,
    year_id UUID NOT NULL REFERENCES years(id),
    month_name TEXT NOT NULL,
    total_allocation DECIMAL(10,2) NOT NULL,
    total_spending DECIMAL(10,2) NOT NULL DEFAULT 0,
    over_budget_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    carried_over_from TEXT,
    UNIQUE (year_id, month_name)
);

CREATE TABLE budget_allocations (
    id UUID PRIMARY KEY,
    month_id UUID NOT NULL REFERENCES months(id),
    contributor_name TEXT NOT NULL,
    percentage_allocation DECIMAL(5,2) NOT NULL,
    contribution_amount DECIMAL(10,2) NOT NULL
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    month_id UUID NOT NULL REFERENCES months(id),
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    notes TEXT
);

CREATE TABLE users (
   id UUID PRIMARY KEY,
   username TEXT
);

CREATE TABLE firefly (
   id UUID PRIMARY KEY,
   user_id UUID NOT NULL REFERENCES users(id),
   api_key TEXT,
   encryption_nounce TEXT,
   source_account TEXT
);

CREATE TABLE notification_subscription (
   id UUID PRIMARY KEY,
   user_id UUID NOT NULL REFERENCES users(id),
   endpoint TEXT,
   expiration_time DATE
);

CREATE TABLE notification_keys (
   id UUID PRIMARY KEY,
   user_id UUID NOT NULL REFERENCES users(id),
   auth TEXT,
   p256dh TEXT
)
