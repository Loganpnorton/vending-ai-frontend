-- Check Status Constraint
-- Let's see what status values are allowed

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'pending_machine_links'::regclass
AND contype = 'c';

-- Check what status values currently exist
SELECT DISTINCT status FROM pending_machine_links ORDER BY status;

-- Check the table definition
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pending_machine_links' 
AND column_name = 'status'
AND table_schema = 'public'; 