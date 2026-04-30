import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yloyibwoorhyyprjikmh.supabase.co';
const supabaseKey = 'sb_publishable_ylpHRXxT7PCzJD1afpwP7A_W4Lfn0Hf';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdmin() {
  const email = 'admin1@aitalenthunt.com';
  const password = 'AdminPassword123!';
  
  console.log('Attempting to create a new admin user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Master Admin'
      }
    }
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
        console.log('User already exists, attempting to login...');
    } else {
        console.error('Sign up error:', signUpError.message);
        return;
    }
  } else {
      console.log('Signed up successfully. Session exists?', !!signUpData.session);
      if (!signUpData.session) {
          console.error('\nCRITICAL: Supabase requires Email Confirmation! You MUST go to your Supabase Dashboard -> Authentication -> Providers -> Email -> Toggle OFF "Confirm email" and save. Then run this again or sign up.\n');
      }
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
      console.error('Login error:', signInError.message);
  } else {
      console.log('Login successful! User ID:', signInData.user.id);
  }
}

fixAdmin();