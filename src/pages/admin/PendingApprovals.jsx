import { useState, useEffect } from 'react';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import toast from 'react-hot-toast';
import { UserCheck, UserX } from 'lucide-react';

export default function PendingApprovals() {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getPendingRecruiters().then(setRecruiters).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (id, verify) => {
    try {
      await api.verifyRecruiter(id, verify);
      toast.success(verify ? 'Recruiter approved!' : 'Recruiter rejected');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Pending Approvals</h2>

      {recruiters.length === 0 ? (
        <EmptyState message="No pending approvals" />
      ) : (
        <div className="grid gap-4">
          {recruiters.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-800">{r.full_name}</h3>
                <p className="text-sm text-slate-500">{r.email}</p>
                <p className="text-xs text-slate-400 mt-1">Registered: {new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleVerify(r.id, true)} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  <UserCheck className="w-4 h-4" />
                  Approve
                </button>
                <button onClick={() => handleVerify(r.id, false)} className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  <UserX className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
