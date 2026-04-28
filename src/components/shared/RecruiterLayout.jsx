import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Briefcase, Users, GitBranch, FilePlus, LogOut, Menu, X, CircleUser as UserCircle } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/recruiter/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/recruiter/jobs', icon: Briefcase, label: 'Browse Jobs' },
  { to: '/recruiter/my-candidates', icon: Users, label: 'My Candidates' },
  { to: '/recruiter/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/recruiter/post-job', icon: FilePlus, label: 'Post a Job' },
];

export default function RecruiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-navy-700">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-blue-400">AI</span> Talent Hunt
          </h1>
          <p className="text-xs text-navy-300 mt-0.5">Recruiter Portal</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
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
              {item.label === 'Post a Job' && !user?.can_post_jobs && (
                <span className="ml-auto text-xs opacity-60">&#128274;</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-navy-700">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-200 hover:bg-navy-800 hover:text-white w-full transition-colors">
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
            <UserCircle className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">{user?.full_name}</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Recruiter</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
