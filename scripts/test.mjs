import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yloyibwoorhyyprjikmh.supabase.co';
const supabaseKey = 'sb_publishable_ylpHRXxT7PCzJD1afpwP7A_W4Lfn0Hf';
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAdmin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@aitalenthunt.com',
    password: 'AdminPassword123!'
  });

  if (error) {
     console.log('Login failed:', error.message);
  } else {
     console.log('Login succeeded with those exact credentials for user:', data.user.id);
  }
}

resetAdmin();