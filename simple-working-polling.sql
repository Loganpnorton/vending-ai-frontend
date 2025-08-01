-- Simple Working Polling Function
-- Based on actual data types: machine_token is UUID, machine_code is text

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_machine_id_by_pairing_code(text);

-- 2. Create a simple polling function
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
        AND status = 'completed' 
        AND used_at IS NOT NULL
    ) THEN
        -- If completed, look for a paired machine
        SELECT 
            m.machine_code,  -- Using machine_code instead of machine_id
            m.machine_token::text  -- Convert UUID to text
        INTO machine_id, machine_token
        FROM machines m
        WHERE m.is_paired = true  -- Check if machine is actually paired
        AND m.status = 'active'   -- Check if machine is active
        LIMIT 1;  -- Get the first paired machine
        
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
        machine_token = machine_token_param::uuid,  -- Convert text to UUID
        updated_at = NOW()
    WHERE machine_code = machine_code_param;
    
    -- Mark the link as completed
    UPDATE pending_machine_links
    SET status = 'completed',
        used_at = NOW(),
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