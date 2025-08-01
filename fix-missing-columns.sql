-- Fix Missing Columns Migration
-- Run this script in your Supabase SQL Editor to add missing columns

-- 1. Add missing columns to pending_machine_links table
ALTER TABLE pending_machine_links 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE pending_machine_links 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour');

-- 2. Add missing columns to machines table
ALTER TABLE machines 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE machines 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Create missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_pending_machine_links_pairing_code ON pending_machine_links(pairing_code);
CREATE INDEX IF NOT EXISTS idx_pending_machine_links_used_at ON pending_machine_links(used_at);
CREATE INDEX IF NOT EXISTS idx_machines_machine_id ON machines(machine_id);
CREATE INDEX IF NOT EXISTS idx_machines_link_id ON machines(link_id);

-- 4. Recreate the functions with the correct column references
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
    
    -- Insert the pending link
    INSERT INTO pending_machine_links (pairing_code, link_id, created_at, expires_at)
    VALUES (new_pairing_code, new_link_id, NOW(), NOW() + INTERVAL '1 hour');
    
    -- Return the generated data
    pairing_code := new_pairing_code;
    link_id := new_link_id;
    
    RETURN NEXT;
END;
$$;

-- 5. Recreate the get_machine_id_by_pairing_code function
CREATE OR REPLACE FUNCTION get_machine_id_by_pairing_code(pairing_code_param text)
RETURNS TABLE(machine_id text, machine_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the pairing code has been used to create a machine
    SELECT m.machine_id, m.machine_token
    INTO machine_id, machine_token
    FROM machines m
    JOIN pending_machine_links pml ON m.link_id = pml.link_id
    WHERE pml.pairing_code = pairing_code_param
      AND pml.used_at IS NOT NULL
      AND (m.is_active IS NULL OR m.is_active = true);
    
    -- Only return if we found a machine
    IF machine_id IS NOT NULL AND machine_token IS NOT NULL THEN
        RETURN NEXT;
    END IF;
END;
$$;

-- 6. Grant permissions again
GRANT EXECUTE ON FUNCTION create_pending_machine_link() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon, authenticated;

-- 7. Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'pending_machine_links' 
ORDER BY ordinal_position;

-- 8. Test the function
-- SELECT * FROM create_pending_machine_link(); 