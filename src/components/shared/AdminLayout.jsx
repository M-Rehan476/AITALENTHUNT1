import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, UserCheck, Users, Briefcase, GitBranch, LogOut, Menu, X, ShieldCheck, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../api';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/approvals', icon: UserCheck, label: 'Pending Approvals', badge: true },
  { to: '/admin/subadmins', icon: ShieldCheck, label: 'Subadmins', adminOnly: true },
  { to: '/admin/recruiters', icon: Users, label: 'Recruiters' },
  { to: '/admin/jobs', icon: Briefcase, label: 'All Jobs' },
  { to: '/admin/candidates', icon: Users, label: 'All Candidates' },
  { to: '/admin/pipeline', icon: GitBranch, label: 'Pipeline' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = () => {
      api.getPendingRecruiters().then(r => setPendingCount(r.length)).catch(() => {});
    };
    fetchPending();

    window.addEventListener('pendingCountUpdated', fetchPending);
    return () => window.removeEventListener('pendingCountUpdated', fetchPending);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-navy-700">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-blue-400">AI</span> Talent Hunt
          </h1>
          <p className="text-xs text-navy-300 mt-0.5">Admin Portal</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.filter(item => !item.adminOnly || user?.email === 'rehan@aitalenthunt.com').map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-navy-200 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.badge && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-navy-700 space-y-2">
          <NavLink to="/admin/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-navy-200 hover:bg-navy-800 hover:text-white'}`}>
            <User className="w-4 h-4" />
            My Profile
          </NavLink>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-200 hover:bg-navy-800 hover:text-white w-full transition-colors bg-navy-800/50">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-slate-100">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-slate-700">{user?.full_name}</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Admin</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
