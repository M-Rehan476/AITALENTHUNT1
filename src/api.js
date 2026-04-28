const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getJobs: () => request('/jobs'),
  createJob: (body) => request('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  getJob: (id) => request(`/jobs/${id}`),
  updateJob: (id, body) => request(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  submitCandidate: (body) => request('/candidates', { method: 'POST', body: JSON.stringify(body) }),
  getMyCandidates: () => request('/candidates/my'),
  getAllCandidates: () => request('/candidates/all'),
  getCandidate: (id) => request(`/candidates/${id}`),
  getMyPipeline: () => request('/pipeline/my'),
  getAllPipeline: () => request('/pipeline/all'),
  updatePipeline: (id, body) => request(`/pipeline/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getRecruiters: () => request('/admin/recruiters'),
  getPendingRecruiters: () => request('/admin/recruiters/pending'),
  verifyRecruiter: (id, is_verified) => request(`/admin/recruiters/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ is_verified }) }),
  togglePosting: (id, can_post_jobs) => request(`/admin/recruiters/${id}/posting`, { method: 'PATCH', body: JSON.stringify({ can_post_jobs }) }),
  getRecruiterProfile: (id) => request(`/admin/recruiters/${id}/profile`),
};
