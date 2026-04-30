-- Add is_rejected to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT false;

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
FOR DELETE USING (
  public.get_my_role() = 'admin'
);
