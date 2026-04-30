-- Add the missing UPDATE policy for profiles
CREATE POLICY "Admins can update profiles" ON profiles
FOR UPDATE USING (
  public.get_my_role() = 'admin'
) WITH CHECK (
  public.get_my_role() = 'admin'
);

-- Also allow a user to update their own profile (optional, but good practice for changing password if we later add profile editing)
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (
  id = auth.uid()
) WITH CHECK (
  id = auth.uid()
);

-- Ensure only Rehan is admin
UPDATE profiles SET role = 'recruiter', can_post_jobs = false, is_verified = false WHERE role = 'admin' AND email != 'rehan@aitalenthunt.com';
UPDATE profiles SET role = 'admin', can_post_jobs = true, is_verified = true WHERE email = 'rehan@aitalenthunt.com';