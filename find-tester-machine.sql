-- Find Tester Machine and Pairing Info
-- Look for the recently paired "tester" machine

-- 1. Find the tester machine
SELECT machine_code, name, is_paired, machine_token, updated_at
FROM machines 
WHERE name = 'tester'
ORDER BY updated_at DESC;

-- 2. Check recent pairing codes to find which one was used for tester
SELECT pairing_code, status, created_at, used_at, machine_id
FROM pending_machine_links 
WHERE status = 'paired'
ORDER BY used_at DESC
LIMIT 5;

-- 3. Check all recent pairing codes (pending and paired)
SELECT pairing_code, status, created_at, used_at, machine_id
FROM pending_machine_links 
ORDER BY created_at DESC 
LIMIT 10; 