-- Check and Create Function
-- This script checks if the function exists and creates it properly

-- 1. Check if the function exists
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'get_machine_id_by_pairing_code'
AND routine_schema = 'public';

-- 2. Drop the function if it exists (to ensure clean creation)
DROP FUNCTION IF EXISTS get_machine_id_by_pairing_code(text);

-- 3. Create the function with explicit parameter naming
CREATE OR REPLACE FUNCTION get_machine_id_by_pairing_code(pairing_code_param text)
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

-- 4. Grant permissions explicitly
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO authenticated;

-- 5. Verify the function was created
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'get_machine_id_by_pairing_code'
AND routine_schema = 'public';

-- 6. Test the function
SELECT * FROM get_machine_id_by_pairing_code('012543'); 