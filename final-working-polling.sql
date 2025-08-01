-- Final Working Polling Function
-- Based on actual schema: id, pairing_code, machine_id, status, used_at

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_machine_id_by_pairing_code(text);

-- 2. Create the correct polling function
CREATE OR REPLACE FUNCTION get_machine_id_by_pairing_code(code text)
RETURNS TABLE(machine_id text, machine_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Look for a completed pairing with this code
    SELECT 
        pml.machine_id,  -- This should contain the machine_code when completed
        m.machine_token
    INTO machine_id, machine_token
    FROM pending_machine_links pml
    LEFT JOIN machines m ON m.machine_code = pml.machine_id
    WHERE pml.pairing_code = code
    AND pml.status = 'completed'
    AND pml.used_at IS NOT NULL
    AND pml.machine_id IS NOT NULL
    AND m.is_paired = true
    AND m.status = 'active';
    
    -- Only return if we found a machine
    IF machine_id IS NOT NULL AND machine_token IS NOT NULL THEN
        RETURN NEXT;
    END IF;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO authenticated;

-- 4. Create a function to complete pairing (for admin use)
CREATE OR REPLACE FUNCTION complete_machine_pairing(
    pairing_code_param text,
    machine_code_param text,
    machine_token_param text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    link_record pending_machine_links%ROWTYPE;
    machine_record machines%ROWTYPE;
BEGIN
    -- Find the pending link
    SELECT * INTO link_record
    FROM pending_machine_links
    WHERE pairing_code = pairing_code_param
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());
    
    IF NOT FOUND THEN
        success := false;
        message := 'Invalid or expired pairing code';
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Check if machine exists
    SELECT * INTO machine_record
    FROM machines
    WHERE machine_code = machine_code_param;
    
    IF NOT FOUND THEN
        success := false;
        message := 'Machine not found';
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Update the machine to mark it as paired
    UPDATE machines
    SET is_paired = true,
        machine_token = machine_token_param,
        updated_at = NOW()
    WHERE machine_code = machine_code_param;
    
    -- Mark the link as completed and store the machine_code
    UPDATE pending_machine_links
    SET status = 'completed',
        used_at = NOW(),
        machine_id = machine_code_param,  -- Store the machine_code in machine_id field
        updated_at = NOW()
    WHERE pairing_code = pairing_code_param;
    
    success := true;
    message := 'Machine paired successfully';
    RETURN NEXT;
END;
$$;

-- 5. Grant permissions for completion function
GRANT EXECUTE ON FUNCTION complete_machine_pairing(text, text, text) TO authenticated;

-- 6. Test the polling function (should return empty for now)
SELECT * FROM get_machine_id_by_pairing_code('057682');

-- 7. Show the function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_machine_id_by_pairing_code'
AND n.nspname = 'public'; 