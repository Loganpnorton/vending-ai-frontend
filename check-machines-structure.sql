-- Check Machines Table Structure
-- Let's see what columns actually exist

-- 1. Check if machines table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'machines' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if machines table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'machines'
) as machines_table_exists;

-- 3. If table doesn't exist, let's see what tables we have
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 