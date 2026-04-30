import { useState, useEffect } from 'react';
import { api } from '../../api';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function SubadminManagement() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const load = () => {
    api.getAdmins().then(data => {
      // Filter out main admin
      setAdmins(data.filter(a => a.email !== 'rehan@aitalenthunt.com'));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await api.deleteRecruiter(deleteModal.id); // Reusing the same RPC delete logic if applicable for auth users
      toast.success('Admin deleted successfully');
      setDeleteModal({ isOpen: false, id: null });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (user?.email !== 'rehan@aitalenthunt.com') {
    return <EmptyState message="Access Denied. Only the main admin can view this page." />;
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Sub-Admins Management</h2>

      {admins.length === 0 ? (
        <EmptyState message="No subadmins found." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Added on</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{a.full_name}</td>
                    <td className="px-5 py-3 text-slate-500">{a.email}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDeleteClick(a.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                      >
                        Delete Admin
                      </button>
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
              <h3 className="text-xl font-bold text-slate-800">Delete Admin</h3>
            </div>
            
            <p className="text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to completely delete this admin? This action is permanent and will remove their profile and authentication credentials from the system across the database.
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
    </div>
  );
}
