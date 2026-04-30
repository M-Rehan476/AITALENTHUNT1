-- 1. Create custom tables
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'recruiter' CHECK (role IN ('admin', 'recruiter')),
  is_verified BOOLEAN DEFAULT false,
  can_post_jobs BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  posted_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  skills TEXT,
  experience_years INTEGER,
  notes TEXT,
  submitted_by UUID REFERENCES profiles(id),
  job_id UUID REFERENCES jobs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  stage TEXT DEFAULT 'Submitted',
  notes TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- 3. Profile Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Jobs Policies
CREATE POLICY "Everyone can view active jobs" ON jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Authorized users can manage jobs" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR can_post_jobs = true))
);

-- 5. Candidates Policies
CREATE POLICY "Read candidates" ON candidates FOR SELECT USING (
  submitted_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Recruiters can insert own candidates" ON candidates FOR INSERT WITH CHECK (
  auth.uid() = submitted_by
);

-- 6. Pipeline Policies
CREATE POLICY "Read pipeline stages" ON pipeline_stages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM candidates 
    WHERE candidates.id = pipeline_stages.candidate_id 
    AND (candidates.submitted_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);
CREATE POLICY "Manage pipeline stages" ON pipeline_stages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) -- Adjusting to allow authenticated users to update statuses
);

-- 7. Trigger to automatically create a profile when a new Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_verified, can_post_jobs)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Recruiter'), 
    new.email,
    -- Make admin@aitalenthunt.com an admin automatically for testing
    CASE WHEN new.email = 'admin@aitalenthunt.com' THEN 'admin' ELSE 'recruiter' END,
    CASE WHEN new.email = 'admin@aitalenthunt.com' THEN true ELSE false END,
    CASE WHEN new.email = 'admin@aitalenthunt.com' THEN true ELSE false END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
