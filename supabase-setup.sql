-- Machine Pairing System Database Setup
-- Run this script in your Supabase SQL Editor

-- 1. Create the pending_machine_links table
CREATE TABLE IF NOT EXISTS pending_machine_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pairing_code TEXT NOT NULL UNIQUE,
    link_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- 2. Create the machines table
CREATE TABLE IF NOT EXISTS machines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_id TEXT NOT NULL UNIQUE,
    machine_token TEXT NOT NULL,
    link_id UUID NOT NULL REFERENCES pending_machine_links(link_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pending_machine_links_pairing_code ON pending_machine_links(pairing_code);
CREATE INDEX IF NOT EXISTS idx_pending_machine_links_used_at ON pending_machine_links(used_at);
CREATE INDEX IF NOT EXISTS idx_machines_machine_id ON machines(machine_id);
CREATE INDEX IF NOT EXISTS idx_machines_link_id ON machines(link_id);

-- 4. Create the create_pending_machine_link function
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
            AND expires_at > NOW()
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

-- 5. Create the get_machine_id_by_pairing_code function
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
      AND m.is_active = true;
    
    -- Only return if we found a machine
    IF machine_id IS NOT NULL AND machine_token IS NOT NULL THEN
        RETURN NEXT;
    END IF;
END;
$$;

-- 6. Create a function to complete the pairing process (for admin use)
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
      AND expires_at > NOW();
    
    -- If no valid pending link found
    IF link_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Mark the link as used
    UPDATE pending_machine_links
    SET used_at = NOW()
    WHERE pairing_code = pairing_code_param;
    
    -- Create the machine record
    INSERT INTO machines (machine_id, machine_token, link_id)
    VALUES (machine_id_param, machine_token_param, link_record.link_id);
    
    RETURN TRUE;
END;
$$;

-- 7. Create a function to clean up expired pending links
CREATE OR REPLACE FUNCTION cleanup_expired_pending_links()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM pending_machine_links
    WHERE expires_at < NOW()
      AND used_at IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 8. Create a scheduled job to clean up expired links (optional)
-- This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-expired-links', '0 */6 * * *', 'SELECT cleanup_expired_pending_links();');

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON pending_machine_links TO anon, authenticated;
GRANT ALL ON machines TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_pending_machine_link() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_machine_id_by_pairing_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_machine_pairing(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_pending_links() TO anon, authenticated;

-- 10. Enable Row Level Security (RLS) for better security
ALTER TABLE pending_machine_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies
-- Allow anyone to create pending links
CREATE POLICY "Allow insert pending links" ON pending_machine_links
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Allow reading pending links by pairing code
CREATE POLICY "Allow read pending links by pairing code" ON pending_machine_links
    FOR SELECT TO anon, authenticated
    USING (true);

-- Allow updating pending links (for marking as used)
CREATE POLICY "Allow update pending links" ON pending_machine_links
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow inserting machines
CREATE POLICY "Allow insert machines" ON machines
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Allow reading machines by link_id
CREATE POLICY "Allow read machines" ON machines
    FOR SELECT TO anon, authenticated
    USING (true);

-- 12. Create a view for easier querying (optional)
CREATE OR REPLACE VIEW active_machines AS
SELECT 
    m.machine_id,
    m.machine_token,
    m.created_at as machine_created_at,
    m.last_seen_at,
    pml.pairing_code,
    pml.created_at as pairing_created_at,
    pml.used_at
FROM machines m
JOIN pending_machine_links pml ON m.link_id = pml.link_id
WHERE m.is_active = true;

-- Grant access to the view
GRANT SELECT ON active_machines TO anon, authenticated;

-- 13. Insert some test data (optional - remove in production)
-- INSERT INTO pending_machine_links (pairing_code, link_id) 
-- VALUES ('123456', gen_random_uuid());

-- 14. Create a function to get machine status
CREATE OR REPLACE FUNCTION get_machine_status(machine_id_param TEXT)
RETURNS TABLE(
    machine_id TEXT,
    is_active BOOLEAN,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    SELECT m.machine_id, m.is_active, m.last_seen_at, m.created_at
    INTO machine_id, is_active, last_seen_at, created_at
    FROM machines m
    WHERE m.machine_id = machine_id_param;
    
    IF machine_id IS NOT NULL THEN
        RETURN NEXT;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_machine_status(text) TO anon, authenticated;

-- Setup complete! 
-- You can now test the functions:
-- SELECT * FROM create_pending_machine_link();
-- SELECT * FROM get_machine_id_by_pairing_code('123456'); 