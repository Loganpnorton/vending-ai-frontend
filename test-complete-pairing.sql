-- Test Complete Pairing Flow
-- This simulates what happens when an admin completes pairing

-- 1. First, let's see what pairing codes are available
SELECT pairing_code, link_id, status, created_at 
FROM pending_machine_links 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Simulate completing a pairing (replace '012543' with an actual pairing code from above)
-- This is what the admin dashboard would call
SELECT * FROM complete_machine_pairing(
    '012543',  -- Replace with actual pairing code
    'machine-001',  -- Machine ID
    'token-abc123'  -- Machine token
);

-- 3. Check if the polling function now returns the machine data
SELECT * FROM get_machine_id_by_pairing_code('012543');

-- 4. Verify the data was created correctly
SELECT 
    pml.pairing_code,
    pml.status,
    pml.used_at,
    m.machine_id,
    m.machine_token,
    m.created_at as machine_created_at
FROM pending_machine_links pml
LEFT JOIN machines m ON m.link_id = pml.link_id
WHERE pml.pairing_code = '012543'; 