-- Fix Polling Function for Actual Data
-- The paired entries have used_at = NULL, so we need to adjust the logic

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_machine_id_by_pairing_code(text);

-- 2. Create the correct polling function
CREATE OR REPLACE FUNCTION get_machine_id_by_pairing_code(code text)
RETURNS TABLE(machine_id text, machine_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Look for a paired machine with this code
    -- Note: paired entries have used_at = NULL in your data
    SELECT 
        m.machine_code,  -- Using machine_code instead of machine_id
        m.machine_token::text  -- Convert UUID to text
    INTO machine_id, machine_token
    FROM pending_machine_links pml
    JOIN machines m ON m.id::text = pml.machine_id  -- Join on machine ID
    WHERE pml.pairing_code = code
    AND pml.status = 'paired'  -- Check if paired
    AND m.is_paired = true  -- Check if machine is actually paired
    AND m.status = 'active';  -- Check if machine is active
    
    -- Only return if we found a machine
    IF machine_id IS NOT NULL AND machine_token IS NOT NULL THEN
        RETURN NEXT;
    END IF;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO authenticated;

-- 4. Test the polling function with the current code
SELECT * FROM get_machine_id_by_pairing_code('050926');

-- 5. Show the function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_machine_id_by_pairing_code'
AND n.nspname = 'public'; 