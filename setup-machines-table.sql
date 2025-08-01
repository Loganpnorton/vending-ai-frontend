-- Setup Machines Table and Complete Polling Function

-- 1. Create the machines table if it doesn't exist
CREATE TABLE IF NOT EXISTS machines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_id TEXT NOT NULL UNIQUE,
    machine_token TEXT NOT NULL,
    link_id UUID NOT NULL REFERENCES pending_machine_links(link_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 2. Add RLS policies for machines table
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Allow anon to read machines (for polling)
CREATE POLICY "Allow anon to read machines" ON machines
    FOR SELECT USING (true);

-- Allow authenticated to manage machines
CREATE POLICY "Allow authenticated to manage machines" ON machines
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Update the polling function to actually check for completed pairing
DROP FUNCTION IF EXISTS get_machine_id_by_pairing_code(text);

CREATE OR REPLACE FUNCTION get_machine_id_by_pairing_code(code text)
RETURNS TABLE(machine_id text, machine_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Look for a machine that was created using this pairing code
    SELECT 
        m.machine_id,
        m.machine_token
    INTO machine_id, machine_token
    FROM pending_machine_links pml
    JOIN machines m ON m.link_id = pml.link_id
    WHERE pml.pairing_code = code
    AND pml.status = 'completed'
    AND pml.used_at IS NOT NULL
    AND m.is_active = true;
    
    -- Only return if we found a machine
    IF machine_id IS NOT NULL AND machine_token IS NOT NULL THEN
        RETURN NEXT;
    END IF;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO authenticated;

-- 5. Create a function to complete pairing (for admin use)
CREATE OR REPLACE FUNCTION complete_machine_pairing(
    pairing_code_param text,
    machine_id_param text,
    machine_token_param text
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    link_record pending_machine_links%ROWTYPE;
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
    
    -- Create the machine record
    INSERT INTO machines (machine_id, machine_token, link_id)
    VALUES (machine_id_param, machine_token_param, link_record.link_id);
    
    -- Mark the link as completed
    UPDATE pending_machine_links
    SET status = 'completed',
        used_at = NOW()
    WHERE pairing_code = pairing_code_param;
    
    success := true;
    message := 'Machine paired successfully';
    RETURN NEXT;
END;
$$;

-- 6. Grant permissions for completion function
GRANT EXECUTE ON FUNCTION complete_machine_pairing(text, text, text) TO authenticated;

-- 7. Test the polling function (should return empty for now)
SELECT * FROM get_machine_id_by_pairing_code('012543');

-- 8. Show the function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_machine_id_by_pairing_code'
AND n.nspname = 'public'; 