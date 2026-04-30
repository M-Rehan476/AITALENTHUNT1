import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yloyibwoorhyyprjikmh.supabase.co';
const supabaseKey = 'sb_publishable_ylpHRXxT7PCzJD1afpwP7A_W4Lfn0Hf';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupNewAdmin() {
  const email = 'rehan@aitalenthunt.com';
  const password = 'AdminPassword123!'; // Feel free to change this in the app later

  console.log(`Setting up ${email} as the exclusive admin...`);

  // 1. Downgrade all current admins to standard recruiters in the profiles table
  const { error: resetError } = await supabase
    .from('profiles')
    .update({ role: 'recruiter', can_post_jobs: false })
    .eq('role', 'admin');

  if (resetError) {
    console.error('Error downgrading old admins:', resetError.message);
  } else {
    console.log('Successfully removed all previous admins.');
  }

  // 2. Try to create the new auth user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: 'Rehan (Admin)' }
    }
  });

  if (signUpError) {
    // If user already exists, that's fine.
    if (signUpError.message.includes('already registered')) {
      console.log('User already exists in Auth. Updating profile instead...');
    } else {
      console.error('Sign up error:', signUpError.message);
      return;
    }
  }

  // 3. Make sure the new profile gets the admin role and is verified in the database
  // We need to get the user ID first, either from signup or by querying the profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (profile) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin', is_verified: true, can_post_jobs: true })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error granting admin privileges:', updateError.message);
    } else {
        console.log(`Successfully upgraded ${email} to Admin status!`);
    }
  } else {
      console.log('Profile might take a second to generate or email confirmation is required.');
  }

  console.log('\n--- NEW ADMIN CREDENTIALS ---');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('-----------------------------\n');
}

setupNewAdmin();