-- Fix Function Signature
-- Create the function with the exact parameter name the React app expects

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_machine_id_by_pairing_code(text);

-- 2. Create the function with parameter name 'code' (exactly what React app expects)
CREATE OR REPLACE FUNCTION get_machine_id_by_pairing_code(code text)
RETURNS TABLE(machine_id text, machine_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- For now, return empty result since we need to understand your machines table structure
    -- This will be updated once we see the actual columns
    machine_id := NULL;
    machine_token := NULL;
    
    -- Only return if we found a machine
    IF machine_id IS NOT NULL AND machine_token IS NOT NULL THEN
        RETURN NEXT;
    END IF;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO authenticated;

-- 4. Test the function
SELECT * FROM get_machine_id_by_pairing_code('012543');

-- 5. Verify the function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_machine_id_by_pairing_code'
AND n.nspname = 'public'; 