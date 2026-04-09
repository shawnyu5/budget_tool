-- budget_allocations table should have a unique(month_id, user_id) restraint
-- Each user should only have a single budget_allocation record for a month
BEGIN;
ALTER TABLE budget_allocations
ADD CONSTRAINT month_unique UNIQUE(month_id, user_id);
COMMIT;
