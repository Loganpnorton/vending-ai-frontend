-- Database Diagnostic Script
-- Run this to see what's currently in your database

-- 1. Check if tables exist
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_name IN ('pending_machine_links', 'machines')
AND table_schema = 'public';

-- 2. Check pending_machine_links table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'pending_machine_links' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check machines table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'machines' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if functions exist
SELECT 
    routine_name,
    CASE WHEN routine_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.routines 
WHERE routine_name IN ('create_pending_machine_link', 'get_machine_id_by_pairing_code')
AND routine_schema = 'public';

-- 5. Check current data in tables
SELECT 'pending_machine_links' as table_name, COUNT(*) as row_count FROM pending_machine_links
UNION ALL
SELECT 'machines' as table_name, COUNT(*) as row_count FROM machines;

-- 6. Test function call (uncomment to test)
-- SELECT * FROM create_pending_machine_link(); 