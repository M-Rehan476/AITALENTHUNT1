import { useState, useEffect } from 'react';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import StageBadge from '../../components/shared/StageBadge';
import { Search } from 'lucide-react';

export default function AllCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [recruiterFilter, setRecruiterFilter] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.getAllCandidates().then(setCandidates).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stages = [...new Set(candidates.map(c => c.current_stage).filter(Boolean))];
  const recruiters = [...new Set(candidates.map(c => c.recruiter_name).filter(Boolean))];

  const filtered = candidates.filter(c => {
    const matchSearch = !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || c.current_stage === stageFilter;
    const matchRecruiter = !recruiterFilter || c.recruiter_name === recruiterFilter;
    return matchSearch && matchStage && matchRecruiter;
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">All Candidates</h2>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Stages</option>
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={recruiterFilter} onChange={e => setRecruiterFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Recruiters</option>
            {recruiters.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No candidates found" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Job</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Recruiter</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Stage</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{c.full_name}</td>
                    <td className="px-5 py-3 text-slate-500">{c.email}</td>
                    <td className="px-5 py-3 text-slate-500">{c.job_title}</td>
                    <td className="px-5 py-3 text-slate-500">{c.recruiter_name}</td>
                    <td className="px-5 py-3"><StageBadge stage={c.current_stage} /></td>
                    <td className="px-5 py-3 text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">{selected.full_name}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Email:</span> <span className="text-slate-800">{selected.email}</span></p>
              {selected.phone && <p><span className="text-slate-500">Phone:</span> <span className="text-slate-800">{selected.phone}</span></p>}
              {selected.linkedin_url && <p><span className="text-slate-500">LinkedIn:</span> <a href={selected.linkedin_url} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{selected.linkedin_url}</a></p>}
              {selected.skills && <p><span className="text-slate-500">Skills:</span> <span className="text-slate-800">{selected.skills}</span></p>}
              <p><span className="text-slate-500">Experience:</span> <span className="text-slate-800">{selected.experience_years} years</span></p>
              <p><span className="text-slate-500">Job:</span> <span className="text-slate-800">{selected.job_title}</span></p>
              <p><span className="text-slate-500">Recruiter:</span> <span className="text-slate-800">{selected.recruiter_name}</span></p>
              <p><span className="text-slate-500">Stage:</span> <StageBadge stage={selected.current_stage} /></p>
              {selected.notes && <p><span className="text-slate-500">Notes:</span> <span className="text-slate-800">{selected.notes}</span></p>}
            </div>
            <button onClick={() => setSelected(null)} className="mt-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
