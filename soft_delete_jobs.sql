-- Add is_deleted column to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Update Jobs Policy to only show non-deleted jobs
DROP POLICY IF EXISTS "Everyone can view active jobs" ON jobs;
CREATE POLICY "Everyone can view active jobs" ON jobs FOR SELECT USING (is_active = true AND is_deleted = false);

DROP POLICY IF EXISTS "Authorized users can manage jobs" ON jobs;
CREATE POLICY "Authorized users can manage jobs" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR can_post_jobs = true))
);
