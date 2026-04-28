import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatsCard from '../../components/shared/StatsCard';
import Spinner from '../../components/shared/Spinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ recruiters: 0, pending: 0, jobs: 0, candidates: 0, hired: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRecruiters(), api.getPendingRecruiters(), api.getJobs(), api.getAllCandidates(), api.getAllPipeline()])
      .then(([recruiters, pending, jobs, candidates, pipeline]) => {
        setStats({
          recruiters: recruiters.length,
          pending: pending.length,
          jobs: jobs.length,
          candidates: candidates.length,
          hired: pipeline.filter(p => p.stage === 'Hired').length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Admin Dashboard</h2>
      <p className="text-slate-500 text-sm mb-6">Overview of your recruitment platform</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard label="Total Recruiters" value={stats.recruiters} color="blue" />
        <StatsCard label="Pending Approvals" value={stats.pending} color="red" />
        <StatsCard label="Total Jobs" value={stats.jobs} color="teal" />
        <StatsCard label="Total Candidates" value={stats.candidates} color="amber" />
        <StatsCard label="Hired" value={stats.hired} color="green" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/admin/approvals" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">Pending Approvals</h3>
          <p className="text-sm text-slate-500 mt-1">Review and verify new recruiter accounts</p>
          {stats.pending > 0 && <span className="inline-block mt-2 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">{stats.pending} pending</span>}
        </Link>
        <Link to="/admin/recruiters" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">Manage Recruiters</h3>
          <p className="text-sm text-slate-500 mt-1">View and manage all recruiter accounts</p>
        </Link>
        <Link to="/admin/jobs" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">All Jobs</h3>
          <p className="text-sm text-slate-500 mt-1">Manage job listings and their status</p>
        </Link>
        <Link to="/admin/candidates" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">All Candidates</h3>
          <p className="text-sm text-slate-500 mt-1">View and manage all submitted candidates</p>
        </Link>
        <Link to="/admin/pipeline" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">Pipeline</h3>
          <p className="text-sm text-slate-500 mt-1">Manage candidate pipeline stages</p>
        </Link>
      </div>
    </div>
  );
}
