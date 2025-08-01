-- Check Machines Table Columns
-- Let's see what columns actually exist in the machines table

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'machines' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check a sample of the data to understand the structure
SELECT * FROM machines LIMIT 3; 