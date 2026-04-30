-- 1. Create SECURITY DEFINER functions to securely fetch profile attributes.
-- SECURITY DEFINER allows these functions to bypass RLS, completely solving the infinite recursion loop.

CREATE OR REPLACE FUNCTION public.get_my_role() 
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_can_post_jobs() 
RETURNS boolean AS $$
  SELECT can_post_jobs FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;


-- 2. Drop the old recursive policies that were crashing the database
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authorized users can manage jobs" ON jobs;
DROP POLICY IF EXISTS "Read candidates" ON candidates;
DROP POLICY IF EXISTS "Read pipeline stages" ON pipeline_stages;


-- 3. Create the new stable policies using our secure functions

-- Profiles table
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING ( public.get_my_role() = 'admin' );

-- Jobs table
CREATE POLICY "Authorized users can manage jobs" ON jobs 
FOR ALL USING (
  public.get_my_role() = 'admin' OR public.get_can_post_jobs() = true
);

-- Candidates table
CREATE POLICY "Read candidates" ON candidates 
FOR SELECT USING (
  submitted_by = auth.uid() OR public.get_my_role() = 'admin'
);

-- Pipeline Stages table
CREATE POLICY "Read pipeline stages" ON pipeline_stages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM candidates 
    WHERE candidates.id = pipeline_stages.candidate_id 
    AND (candidates.submitted_by = auth.uid() OR public.get_my_role() = 'admin')
  )
);
