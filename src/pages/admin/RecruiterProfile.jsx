import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import StageBadge from '../../components/shared/StageBadge';
import EmptyState from '../../components/shared/EmptyState';

export default function RecruiterProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRecruiterProfile(id).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!data) return <div className="text-center text-slate-500 py-12">Recruiter not found</div>;

  const { profile, jobs, candidates } = data;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Recruiter Profile</h2>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
            {profile.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{profile.full_name}</h3>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <div className="flex gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${profile.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {profile.is_verified ? 'Verified' : 'Pending'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${profile.can_post_jobs ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {profile.can_post_jobs ? 'Can Post Jobs' : 'No Posting'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Jobs Posted ({jobs.length})</h3>
          </div>
          {jobs.length === 0 ? (
            <EmptyState message="No jobs posted" />
          ) : (
            <div className="divide-y divide-slate-100">
              {jobs.map(j => (
                <div key={j.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-slate-700">{j.title}</p>
                  <p className="text-xs text-slate-400">{j.company} - {j.location}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Candidates Submitted ({candidates.length})</h3>
          </div>
          {candidates.length === 0 ? (
            <EmptyState message="No candidates submitted" />
          ) : (
            <div className="divide-y divide-slate-100">
              {candidates.map(c => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{c.full_name}</p>
                    <p className="text-xs text-slate-400">{c.job_title}</p>
                  </div>
                  <StageBadge stage={c.current_stage} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
