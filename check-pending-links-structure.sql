-- Check Pending Machine Links Table Structure
-- Let's see what columns actually exist

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'pending_machine_links' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check a sample of the data
SELECT * FROM pending_machine_links LIMIT 3; 