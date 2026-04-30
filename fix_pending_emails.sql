-- Create a secure RPC to fetch securely pending recruiters who have verified their emails
CREATE OR REPLACE FUNCTION get_pending_recruiters()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  is_verified BOOLEAN,
  is_rejected BOOLEAN,
  can_post_jobs BOOLEAN,
  candidate_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Only allow admins to read pending queries
  IF public.get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT 
    p.id, 
    p.full_name, 
    p.email, 
    p.role, 
    p.is_verified, 
    p.is_rejected, 
    p.can_post_jobs, 
    0::INTEGER as candidate_count, -- we can just pass 0 or execute a subquery if needed later
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.role = 'recruiter' 
    AND p.is_verified = false 
    AND p.is_rejected = false
    AND u.email_confirmed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
