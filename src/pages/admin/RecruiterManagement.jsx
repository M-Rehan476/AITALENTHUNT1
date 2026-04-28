import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import toast from 'react-hot-toast';

export default function RecruiterManagement() {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    api.getRecruiters().then(setRecruiters).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleVerify = async (id, current) => {
    try {
      await api.verifyRecruiter(id, !current);
      toast.success('Verification status updated');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const togglePosting = async (id, current) => {
    try {
      await api.togglePosting(id, !current);
      toast.success('Posting permission updated');
      load();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Recruiter Management</h2>

      {recruiters.length === 0 ? (
        <EmptyState message="No recruiters yet" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Registered</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Verified</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Can Post</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Candidates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recruiters.map(r => (
                  <tr key={r.id} onClick={() => navigate(`/admin/recruiters/${r.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.full_name}</td>
                    <td className="px-5 py-3 text-slate-500">{r.email}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleVerify(r.id, !!r.is_verified)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${r.is_verified ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {r.is_verified ? 'Verified' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => togglePosting(r.id, !!r.can_post_jobs)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${r.can_post_jobs ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {r.can_post_jobs ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{r.candidate_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
