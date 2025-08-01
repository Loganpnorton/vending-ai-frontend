-- Fix Polling Logic
-- The machine is paired, but the polling function isn't finding it

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_machine_id_by_pairing_code(text);

-- 2. Create a simpler polling function that works
CREATE OR REPLACE FUNCTION get_machine_id_by_pairing_code(code text)
RETURNS TABLE(machine_id text, machine_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First, check if the pairing code has been completed
    IF EXISTS (
        SELECT 1 FROM pending_machine_links 
        WHERE pairing_code = code 
        AND status = 'paired'  -- Changed from 'completed' to 'paired'
        AND used_at IS NOT NULL
    ) THEN
        -- If completed, look for ANY paired machine (not just the first one)
        SELECT 
            m.machine_code,  -- Using machine_code instead of machine_id
            m.machine_token::text  -- Convert UUID to text
        INTO machine_id, machine_token
        FROM machines m
        WHERE m.is_paired = true  -- Check if machine is actually paired
        AND m.status = 'active'   -- Check if machine is active
        ORDER BY m.updated_at DESC  -- Get the most recently updated paired machine
        LIMIT 1;
        
        -- Only return if we found a machine
        IF machine_id IS NOT NULL AND machine_token IS NOT NULL THEN
            RETURN NEXT;
        END IF;
    END IF;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO authenticated;

-- 4. Test the polling function (should now return data!)
SELECT * FROM get_machine_id_by_pairing_code('057682');

-- 5. Show the function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_machine_id_by_pairing_code'
AND n.nspname = 'public'; 