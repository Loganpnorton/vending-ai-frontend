-- Custom Fix for Your Existing Schema
-- This script adapts to your current table structure

-- 1. Add missing columns to pending_machine_links table
ALTER TABLE pending_machine_links 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE pending_machine_links 
ADD COLUMN IF NOT EXISTS link_id UUID NULL;

-- 2. Update expires_at default if it doesn't have one
ALTER TABLE pending_machine_links 
ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '1 hour');

-- 3. Add missing columns to machines table
ALTER TABLE machines 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE machines 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Create missing indexes
CREATE INDEX IF NOT EXISTS idx_pending_machine_links_pairing_code ON pending_machine_links(pairing_code);
CREATE INDEX IF NOT EXISTS idx_pending_machine_links_used_at ON pending_machine_links(used_at);
CREATE INDEX IF NOT EXISTS idx_machines_machine_id ON machines(machine_id);

-- 5. Create functions that work with your schema
CREATE OR REPLACE FUNCTION create_pending_machine_link()
RETURNS TABLE(pairing_code text, link_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_pairing_code TEXT;
    new_link_id UUID;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    -- Generate a unique 6-digit pairing code
    LOOP
        new_pairing_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
        
        -- Check if this pairing code already exists and is not expired
        IF NOT EXISTS (
            SELECT 1 FROM pending_machine_links 
            WHERE pairing_code = new_pairing_code 
            AND (expires_at IS NULL OR expires_at > NOW())
        ) THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique pairing code after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    -- Generate a unique link_id
    new_link_id := gen_random_uuid();
    
    -- Insert the pending link (adapted to your schema)
    INSERT INTO pending_machine_links (pairing_code, link_id, created_at, expires_at, status)
    VALUES (new_pairing_code, new_link_id, NOW(), NOW() + INTERVAL '1 hour', 'pending');
    
    -- Return the generated data
    pairing_code := new_pairing_code;
    link_id := new_link_id;
    
    RETURN NEXT;
END;
$$;

-- 6. Create polling function adapted to your schema
CREATE OR REPLACE FUNCTION get_machine_id_by_pairing_code(pairing_code_param text)
RETURNS TABLE(machine_id text, machine_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the pairing code has been used to create a machine
    -- Adapted to work with your schema where machine_id might be in pending_machine_links
    SELECT 
        COALESCE(m.machine_id, pml.machine_id::text) as machine_id,
        m.machine_token
    INTO machine_id, machine_token
    FROM pending_machine_links pml
    LEFT JOIN machines m ON m.id = pml.machine_id
    WHERE pml.pairing_code = pairing_code_param
      AND pml.used_at IS NOT NULL
      AND pml.status = 'completed';
    
    -- Only return if we found a machine
    IF machine_id IS NOT NULL AND machine_token IS NOT NULL THEN
        RETURN NEXT;
    END IF;
END;
$$;

-- 7. Create a function to complete pairing (for admin use)
CREATE OR REPLACE FUNCTION complete_machine_pairing(
    pairing_code_param TEXT,
    machine_id_param TEXT,
    machine_token_param TEXT
)
RETURNS BOOLEAN
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
      AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW());
    
    -- If no valid pending link found
    IF link_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Mark the link as used
    UPDATE pending_machine_links
    SET used_at = NOW(),
        status = 'completed',
        machine_id = machine_id_param::uuid
    WHERE pairing_code = pairing_code_param;
    
    -- Create the machine record if it doesn't exist
    INSERT INTO machines (machine_id, machine_token, created_at, last_seen_at, is_active)
    VALUES (machine_id_param, machine_token_param, NOW(), NOW(), true)
    ON CONFLICT (machine_id) DO UPDATE SET
        machine_token = EXCLUDED.machine_token,
        last_seen_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION create_pending_machine_link() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_machine_pairing(text, text, text) TO anon, authenticated;

-- 9. Test the function
SELECT * FROM create_pending_machine_link(); 