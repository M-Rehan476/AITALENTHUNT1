import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheck, User } from 'lucide-react';
import ChangePasswordModal from '../../components/shared/ChangePasswordModal';

export default function MyProfile() {
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h2>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{user?.full_name}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user?.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {user?.role === 'admin' ? 'Admin' : 'Recruiter'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h4 className="font-semibold text-slate-800 mb-4">Account Actions</h4>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Change Password
          </button>
        </div>
      </div>

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
}