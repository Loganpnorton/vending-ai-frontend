-- Test Current Pairing Status
-- Check what pairing codes are available and their status

-- 1. Check current pairing codes
SELECT pairing_code, status, created_at, used_at
FROM pending_machine_links 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Test completing the pairing with the current code (050926)
SELECT * FROM complete_machine_pairing(
    '050926',  -- Current pairing code from the logs
    'VM-001',  -- Machine code
    '550e8400-e29b-41d4-a716-446655440000'  -- Machine token
);

-- 3. Check if the polling function now returns data
SELECT * FROM get_machine_id_by_pairing_code('050926');

-- 4. Verify the machine was updated
SELECT machine_code, name, is_paired, machine_token, updated_at
FROM machines 
WHERE machine_code = 'VM-001'; 