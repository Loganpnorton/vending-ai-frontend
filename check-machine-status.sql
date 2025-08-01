-- Check Machine Status
-- Let's see what happened to the machine

-- 1. Check the current machine status
SELECT machine_code, name, is_paired, machine_token, updated_at
FROM machines 
WHERE machine_code = 'VM-001';

-- 2. Check if the machine was updated at all
SELECT machine_code, name, is_paired, machine_token, updated_at
FROM machines 
WHERE machine_code = 'VM-001';

-- 3. Check if there are any machines with is_paired = true
SELECT machine_code, name, is_paired, machine_token, status
FROM machines 
WHERE is_paired = true; 