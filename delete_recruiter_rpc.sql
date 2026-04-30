-- Ensure the user can fully delete the auth account, which cascades to profiles
CREATE OR REPLACE FUNCTION delete_recruiter(target_user_id UUID)
RETURNS void AS $$
BEGIN
  IF public.get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
