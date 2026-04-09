-- Switch from contributor_name to user_id in budget_allocations table
ALTER TABLE budget_allocations
ADD COLUMN user_id UUID NOT NULL;

ALTER TABLE budget_allocations
DROP COLUMN contributor_name;
