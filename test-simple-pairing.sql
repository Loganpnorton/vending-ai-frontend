-- Test Simple Pairing Flow
-- This simulates what happens when an admin completes pairing

-- 1. First, let's see what pairing codes are available
SELECT pairing_code, link_id, status, created_at 
FROM pending_machine_links 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check current machine status
SELECT machine_code, name, is_paired, machine_token 
FROM machines 
WHERE machine_code = 'VM-001';

-- 3. Simulate completing a pairing (replace '012543' with an actual pairing code from above)
-- This is what the admin dashboard would call
SELECT * FROM complete_machine_pairing(
    '012543',  -- Replace with actual pairing code
    'VM-001',  -- Machine code (from your existing machine)
    'new-token-abc123'  -- New machine token
);

-- 4. Check if the polling function now returns the machine data
SELECT * FROM get_machine_id_by_pairing_code('012543');

-- 5. Verify the machine was updated
SELECT machine_code, name, is_paired, machine_token, updated_at
FROM machines 
WHERE machine_code = 'VM-001';

-- 6. Verify the link was marked as completed
SELECT pairing_code, status, used_at, machine_code
FROM pending_machine_links 
WHERE pairing_code = '012543'; 