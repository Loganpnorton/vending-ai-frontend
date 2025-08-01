-- Test Simple Working Pairing Flow
-- This simulates what happens when an admin completes pairing

-- 1. First, let's see what pairing codes are available
SELECT id, pairing_code, status, created_at, machine_id
FROM pending_machine_links 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check current machine status
SELECT machine_code, name, is_paired, machine_token 
FROM machines 
WHERE machine_code = 'VM-001';

-- 3. Simulate completing a pairing (replace '057682' with an actual pairing code from above)
-- This is what the admin dashboard would call
SELECT * FROM complete_machine_pairing(
    '057682',  -- Replace with actual pairing code from step 1
    'VM-001',  -- Machine code (from your existing machine)
    '550e8400-e29b-41d4-a716-446655440000'  -- New machine token (valid UUID)
);

-- 4. Check if the polling function now returns the machine data
SELECT * FROM get_machine_id_by_pairing_code('057682');

-- 5. Verify the machine was updated
SELECT machine_code, name, is_paired, machine_token, updated_at
FROM machines 
WHERE machine_code = 'VM-001';

-- 6. Verify the link was marked as completed
SELECT id, pairing_code, status, used_at, machine_id, updated_at
FROM pending_machine_links 
WHERE pairing_code = '057682'; 