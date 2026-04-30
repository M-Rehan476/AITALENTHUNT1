import { Link, useLocation } from 'react-router-dom';
import { Clock } from 'lucide-react';

export default function PendingApproval() {
  const location = useLocation();
  const email = location.state?.email || '';

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Account Pending Approval</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your account has been submitted for admin approval. You'll be notified once verified.
          </p>
          {email && <p className="text-xs text-slate-400 mb-6">Registered as: {email}</p>}
          <Link
            to="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
