import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import toast from 'react-hot-toast';
import { AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function RecruiterManagement() {
  const { user } = useAuth();
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [adminModal, setAdminModal] = useState({ isOpen: false, id: null });
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

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const handleMakeAdminClick = (id) => {
    setAdminModal({ isOpen: true, id });
  };

  const confirmMakeAdmin = async () => {
    if (!adminModal.id) return;
    try {
      await api.makeAdmin(adminModal.id);
      toast.success('User is now an admin');
      setAdminModal({ isOpen: false, id: null });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await api.deleteRecruiter(deleteModal.id);
      toast.success('Recruiter deleted successfully');
      setDeleteModal({ isOpen: false, id: null });
      load();
    } catch (err) {
      toast.error(err.message);
    }
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
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Can Post</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Candidates</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
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
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${r.is_verified ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {r.is_verified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-slate-500 capitalize">
                      {r.is_rejected ? 'Rejected' : (r.is_verified ? 'Approved' : 'Pending')}
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => togglePosting(r.id, !!r.can_post_jobs)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${r.can_post_jobs ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {r.can_post_jobs ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{r.candidate_count || 0}</td>
                    <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {user?.email === 'rehan@aitalenthunt.com' && (
                          <button
                            onClick={() => handleMakeAdminClick(r.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50"
                          >
                            Make Admin
                          </button>
                        )}
                        {user?.email === 'rehan@aitalenthunt.com' && (
                          <button
                            onClick={() => handleDeleteClick(r.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Delete Recruiter</h3>
            </div>
            
            <p className="text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to completely delete this recruiter? This action is permanent and will remove their profile and authentication credentials from the system across the database.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {adminModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4 text-blue-600">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Promote to Admin</h3>
            </div>
            
            <p className="text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to promote this user to an Admin? They will have full access to view, edit, and orchestrate campaigns, recruiters, and the sub-admin portal.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAdminModal({ isOpen: false, id: null })}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMakeAdmin}
                className="px-4 py-2 font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Confirm Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
