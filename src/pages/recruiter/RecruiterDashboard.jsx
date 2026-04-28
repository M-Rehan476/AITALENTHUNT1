import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import StatsCard from '../../components/shared/StatsCard';
import Spinner from '../../components/shared/Spinner';
import StageBadge from '../../components/shared/StageBadge';
import { Link } from 'react-router-dom';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ jobs: 0, candidates: 0, pipeline: 0, activeJobs: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getJobs(), api.getMyCandidates(), api.getMyPipeline()])
      .then(([jobs, candidates, pipeline]) => {
        setStats({
          jobs: jobs.length,
          candidates: candidates.length,
          pipeline: pipeline.length,
          activeJobs: jobs.filter(j => j.is_active).length,
        });
        setRecent(candidates.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome, {user?.full_name}</h2>
      <p className="text-slate-500 text-sm mb-6">Here's your recruiting activity overview</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Jobs Available" value={stats.jobs} color="blue" />
        <StatsCard label="My Candidates" value={stats.candidates} color="green" />
        <StatsCard label="In Pipeline" value={stats.pipeline} color="amber" />
        <StatsCard label="Active Jobs" value={stats.activeJobs} color="teal" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Candidates</h3>
          <Link to="/recruiter/my-candidates" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No candidates submitted yet</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map(c => (
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
  );
}
