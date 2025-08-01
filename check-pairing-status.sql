-- Check Pairing Status
-- Verify which pairing code was completed and test polling

-- 1. Check all pairing codes and their status
SELECT pairing_code, status, created_at, used_at, machine_id
FROM pending_machine_links 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Test polling with the most recent completed pairing code
-- (We need to find which code was actually used to complete the pairing)
SELECT * FROM get_machine_id_by_pairing_code('050926');

-- 3. Check if there are any paired codes
SELECT pairing_code, status, used_at
FROM pending_machine_links 
WHERE status = 'paired'
ORDER BY used_at DESC; 