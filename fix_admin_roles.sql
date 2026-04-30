-- 1. First, temporarily disable RLS to avoid the infinite recursion policy error during our manual update
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Demote all existing admins to recruiters
UPDATE profiles 
SET role = 'recruiter', can_post_jobs = false, is_verified = false 
WHERE role = 'admin';

-- 3. Upgrade the newly created user matching 'rehan@aitalenthunt.com' to an admin
UPDATE profiles 
SET role = 'admin', can_post_jobs = true, is_verified = true 
WHERE email = 'rehan@aitalenthunt.com';

-- 4. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
