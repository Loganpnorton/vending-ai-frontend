-- Test Complete Pairing Flow
-- Verify that the polling function now returns machine data

-- 1. Check if the polling function returns data for the paired code
SELECT * FROM get_machine_id_by_pairing_code('057682');

-- 2. Check the current machine status
SELECT machine_code, name, is_paired, machine_token, updated_at
FROM machines 
WHERE machine_code = 'VM-001';

-- 3. Check the paired link status
SELECT id, pairing_code, status, used_at, machine_id, updated_at
FROM pending_machine_links 
WHERE pairing_code = '057682'; 