-- Check Current Status Values
-- Let's see what status values currently exist

SELECT DISTINCT status FROM pending_machine_links ORDER BY status;

-- Also check the constraint definition more directly
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'pending_machine_links'::regclass
AND contype = 'c'; 