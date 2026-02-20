-- months.total_allocation key can be calculated on the fly using sql. No point storing it
-- But the months table is used as a foreign key in other tables, so it has to stay
ALTER TABLE months
DROP COLUMN total_allocation
