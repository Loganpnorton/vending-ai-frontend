-- Check Data Types
-- Let's see the exact data types of the columns

-- Check pending_machine_links columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pending_machine_links' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check machines columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'machines' 
AND table_schema = 'public'
ORDER BY ordinal_position; 