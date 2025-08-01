-- Force Schema Refresh and Verify Function
-- This script forces Supabase to refresh its schema cache

-- 1. Check the exact function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_machine_id_by_pairing_code'
AND n.nspname = 'public';

-- 2. Check if the function is accessible to anon/authenticated
SELECT 
    routine_name,
    routine_type,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_name = 'get_machine_id_by_pairing_code'
AND routine_schema = 'public';

-- 3. Force a schema refresh by calling the function directly
SELECT * FROM get_machine_id_by_pairing_code('test');

-- 4. Check if there are any RLS policies that might be blocking access
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. Verify the function is callable with the exact signature the React app expects
-- The React app calls: get_machine_id_by_pairing_code(code)
-- Let's test this exact signature
SELECT * FROM get_machine_id_by_pairing_code('012543'); 