-- Check Machines Table Structure
-- This will help us create the proper polling logic

-- 1. Check machines table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'machines' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current data in machines table
SELECT * FROM machines LIMIT 5;

-- 3. Check if there are any existing machine records
SELECT COUNT(*) as total_machines FROM machines;

-- 4. Check the relationship between pending_machine_links and machines
SELECT 
    pml.pairing_code,
    pml.status,
    pml.used_at,
    m.id as machine_id,
    m.machine_token
FROM pending_machine_links pml
LEFT JOIN machines m ON m.id = pml.machine_id
ORDER BY pml.created_at DESC
LIMIT 10; 