import { supabase } from './lib/supabase';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

export const api = {
  register: async (body) => {
    if (!body.email.endsWith('@aitalenthunt.com')) {
      throw new Error('Registration is restricted to @aitalenthunt.com business emails only.');
    }
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: { data: { full_name: body.full_name } }
    });
    if (error) throw new Error(error.message);
    return { user: data.user, token: data.session?.access_token };
  },
  
  login: async (body) => {
    if (!body.email.endsWith('@aitalenthunt.com')) {
      throw new Error('Login is restricted to @aitalenthunt.com business emails only.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) throw new Error(error.message);
    return { user: data.user, token: data.session?.access_token };
  },
  
  getJobs: async () => {
    // Only return jobs that are not 'deleted'
    const { data, error } = await supabase.from('jobs').select('*, profiles(full_name)').eq('is_deleted', false).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    
    return data.map(j => ({
      ...j,
      posted_by_name: j.profiles?.full_name || 'Admin'
    }));
  },
  
  createJob: async (body) => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('jobs').insert([{ ...body, posted_by: userId }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  
  getJob: async (id) => {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  },
  
  updateJob: async (id, body) => {
    const { data, error } = await supabase.from('jobs').update(body).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  
  deleteJob: async (id) => {
    const { data, error } = await supabase.from('jobs').update({ is_deleted: true, is_active: false }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  
  submitCandidate: async (body) => {
    // Check if job is active before submitting
    const { data: jobInfo, error: jobErr } = await supabase.from('jobs').select('is_active').eq('id', body.job_id).single();
    if (jobErr) throw new Error(jobErr.message);
    if (!jobInfo.is_active) throw new Error('Cannot submit a candidate for an inactive job.');

    const userId = await getUserId();
    // Insert candidate
    const { data: candidate, error: candError } = await supabase
      .from('candidates')
      .insert([{ ...body, submitted_by: userId }])
      .select().single();
    if (candError) throw new Error(candError.message);
    
    // Create initial pipeline stage
    const { error: plError } = await supabase
      .from('pipeline_stages')
      .insert([{ 
        candidate_id: candidate.id, 
        job_id: body.job_id, 
        stage: 'Submitted',
        updated_by: userId
      }]);
    if (plError) throw new Error(plError.message);
    return candidate;
  },
  
  getMyCandidates: async () => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('candidates').select('*, jobs(title)').eq('submitted_by', userId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const { data: pipelines } = await supabase.from('pipeline_stages').select('*');

    return data.map(c => {
      const cLines = (pipelines || []).filter(p => p.candidate_id === c.id);
      const latestStage = cLines.length > 0 ? cLines.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))[0].stage : 'Submitted';
      return {
        ...c,
        job_title: c.jobs?.title || 'Unknown Job',
        current_stage: latestStage
      };
    });
  },
  
  getAllCandidates: async () => {
    const { data, error } = await supabase.from('candidates').select('*, jobs(title), profiles!submitted_by(full_name)').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const { data: pipelines } = await supabase.from('pipeline_stages').select('*');

    return data.map(c => {
      const cLines = (pipelines || []).filter(p => p.candidate_id === c.id);
      const latestStage = cLines.length > 0 ? cLines.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))[0].stage : 'Submitted';
      return {
        ...c,
        job_title: c.jobs?.title || 'Unknown Job',
        recruiter_name: c.profiles?.full_name || 'Unknown Recruiter',
        current_stage: latestStage
      };
    });
  },
  
  getCandidate: async (id) => {
    const { data, error } = await supabase.from('candidates').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  },
  
  getMyPipeline: async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*, candidates(*), jobs(*)')
      .eq('candidates.submitted_by', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);

    return data.map(p => ({
      ...p,
      candidate_name: p.candidates?.full_name || 'Unknown',
      job_title: p.jobs?.title || 'Unknown'
    }));
  },
  
  getAllPipeline: async () => {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*, candidates(*, profiles!submitted_by(*)), jobs(title)')
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    
    return data.map(p => ({
      ...p,
      candidate_name: p.candidates?.full_name || 'Unknown',
      recruiter_name: p.candidates?.profiles?.full_name || 'Unknown',
      job_title: p.jobs?.title || 'Unknown'
    }));
  },
  
  updatePipeline: async (id, body) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('pipeline_stages')
      .update({ ...body, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();
    if (error) throw new Error(error.message);

    // After successfully updating the database, trigger the Edge Function to send emails securely
    try {
      await supabase.functions.invoke('notify-pipeline-stage', {
        body: { pipeline_id: id, stage: body.stage, notes: body.notes }
      });
    } catch (edgeError) {
      console.error('Failed to trigger email notification:', edgeError);
      // We don't throw here to avoid preventing the UI from updating if the email silently fails
    }

    return data;
  },
  
  getRecruiters: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, candidates(id)')
      .eq('role', 'recruiter');
      
    if (error) {
      // Fallback if relation mapping fails
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'recruiter');
      return fallbackData || [];
    }
    
    return data.map(r => ({
      ...r,
      candidate_count: r.candidates ? r.candidates.length : 0
    }));
  },

  getAdmins: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');
    if (error) throw new Error(error.message);
    return data;
  },
  
  getPendingRecruiters: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'recruiter')
      .eq('is_verified', false)
      .eq('is_rejected', false);
    if (error) throw new Error(error.message);
    return data;
  },
  
  verifyRecruiter: async (id, is_verified) => {
    // If is_verified is true, we set is_verified: true, is_rejected: false
    // If is_verified is false (reject), we set is_verified: false, is_rejected: true
    const updates = is_verified 
      ? { is_verified: true, is_rejected: false }
      : { is_verified: false, is_rejected: true };
      
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    window.dispatchEvent(new Event('pendingCountUpdated'));
    return data;
  },

  makeAdmin: async (id) => {
    const { data, error } = await supabase.from('profiles').update({ role: 'admin', is_verified: true, can_post_jobs: true }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  
  
  deleteRecruiter: async (id) => {
    const { error } = await supabase.rpc('delete_recruiter', { target_user_id: id });
    if (error) throw new Error(error.message);
    window.dispatchEvent(new Event('pendingCountUpdated'));
    return true;
  },
  
  togglePosting: async (id, can_post_jobs) => {
    const { data, error } = await supabase.from('profiles').update({ can_post_jobs }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  
  getRecruiterProfile: async (id) => {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    
    const { data: jobs = [] } = await supabase.from('jobs').select('*').eq('posted_by', id).eq('is_deleted', false);
    const { data: candidates = [] } = await supabase.from('candidates').select('*, jobs(title)').eq('submitted_by', id);
    
    const { data: pipelines = [] } = await supabase.from('pipeline_stages').select('*');
    
    const mappedCandidates = candidates.map(c => {
      const cLines = pipelines.filter(p => p.candidate_id === c.id);
      const latestStage = cLines.length > 0 ? cLines.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))[0].stage : 'Submitted';
      return {
        ...c,
        job_title: c.jobs?.title || 'Unknown Job',
        current_stage: latestStage
      };
    });

    return { profile, jobs: jobs || [], candidates: mappedCandidates };
  }
};
