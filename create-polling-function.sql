-- Create the missing polling function
-- This function is called by the React app to check if pairing is complete

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon, authenticated;

-- Test the function
SELECT * FROM get_machine_id_by_pairing_code('698954'); 