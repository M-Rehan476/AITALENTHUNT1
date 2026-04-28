import { useState, useEffect } from 'react';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import toast from 'react-hot-toast';

export default function AllJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    api.getJobs().then(async (activeJobs) => {
      try {
        const allCandidates = await api.getAllCandidates();
        const jobsWithCounts = activeJobs.map(j => ({
          ...j,
          candidate_count: allCandidates.filter(c => c.job_id === j.id).length,
        }));
        setJobs(jobsWithCounts);
      } catch {
        setJobs(activeJobs.map(j => ({ ...j, candidate_count: 0 })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id, current) => {
    try {
      await api.updateJob(id, { is_active: !current });
      toast.success('Job status updated');
      load();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">All Jobs</h2>

      {jobs.length === 0 ? (
        <EmptyState message="No jobs posted yet" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Title</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Company</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Posted By</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Candidates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(j => (
                  <tr key={j.id} onClick={() => setSelected(j)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{j.title}</td>
                    <td className="px-5 py-3 text-slate-500">{j.company}</td>
                    <td className="px-5 py-3 text-slate-500">{j.posted_by_name || 'Admin'}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(j.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleActive(j.id, !!j.is_active)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${j.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {j.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{j.candidate_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">{selected.title}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Company:</span> <span className="text-slate-800">{selected.company}</span></p>
              <p><span className="text-slate-500">Location:</span> <span className="text-slate-800">{selected.location}</span></p>
              <p><span className="text-slate-500">Type:</span> <span className="text-slate-800">{selected.job_type}</span></p>
              {selected.salary_range && <p><span className="text-slate-500">Salary:</span> <span className="text-slate-800">{selected.salary_range}</span></p>}
              {selected.description && <p><span className="text-slate-500">Description:</span> <span className="text-slate-800">{selected.description}</span></p>}
              {selected.requirements && <p><span className="text-slate-500">Requirements:</span> <span className="text-slate-800">{selected.requirements}</span></p>}
            </div>
            <button onClick={() => setSelected(null)} className="mt-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
