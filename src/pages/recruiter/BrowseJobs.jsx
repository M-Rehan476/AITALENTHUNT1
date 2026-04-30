import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import { Search, MapPin, Briefcase, DollarSign, Calendar, UserPlus } from 'lucide-react';

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    api.getJobs().then(data => setJobs(data.filter(j => j.is_active))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || j.job_type === typeFilter;
    const matchLoc = !locationFilter || j.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchType && matchLoc;
  });

  const types = [...new Set(jobs.map(j => j.job_type))];

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Browse Jobs</h2>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="text"
            placeholder="Filter by location"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No jobs match your search" />
      ) : (
        <div className="grid gap-4">
          {filtered.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800">{job.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{job.company}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.job_type}</span>
                    {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.salary_range}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  {job.description && <p className="text-sm text-slate-600 mt-3 line-clamp-2">{job.description}</p>}
                </div>
                <Link
                  to={`/recruiter/submit-candidate/${job.id}`}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  Submit Candidate
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
