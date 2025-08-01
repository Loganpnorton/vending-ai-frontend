-- Drop and Recreate Functions
-- This script drops existing functions and creates new ones

-- 1. Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_pending_machine_link();
DROP FUNCTION IF EXISTS get_machine_id_by_pairing_code(text);

-- 2. Add the missing used_at column
ALTER TABLE pending_machine_links 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE NULL;

-- 3. Create the create_pending_machine_link function
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
    
    -- Insert the pending link with only the columns that exist
    INSERT INTO pending_machine_links (pairing_code, created_at, expires_at, status)
    VALUES (new_pairing_code, NOW(), NOW() + INTERVAL '1 hour', 'pending');
    
    -- Return the generated data
    pairing_code := new_pairing_code;
    link_id := new_link_id;
    
    RETURN NEXT;
END;
$$;

-- 4. Create the get_machine_id_by_pairing_code function
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

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION create_pending_machine_link() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon, authenticated;

-- 6. Test the function
SELECT * FROM create_pending_machine_link(); 