import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import RecruiterLayout from './components/shared/RecruiterLayout';
import AdminLayout from './components/shared/AdminLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import PendingApproval from './pages/auth/PendingApproval';

// Recruiter pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import BrowseJobs from './pages/recruiter/BrowseJobs';
import SubmitCandidate from './pages/recruiter/SubmitCandidate';
import MyCandidates from './pages/recruiter/MyCandidates';
import RecruiterPipeline from './pages/recruiter/RecruiterPipeline';
import PostJob from './pages/recruiter/PostJob';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingApprovals from './pages/admin/PendingApprovals';
import SubadminManagement from './pages/admin/SubadminManagement';
import RecruiterManagement from './pages/admin/RecruiterManagement';
import AllJobs from './pages/admin/AllJobs';
import AllCandidates from './pages/admin/AllCandidates';
import AdminPipeline from './pages/admin/AdminPipeline';
import RecruiterProfile from './pages/admin/RecruiterProfile';
import MyProfile from './pages/shared/MyProfile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: '#1e293b', color: '#fff', fontSize: '14px' } }} />
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Recruiter portal */}
          <Route path="/recruiter" element={<ProtectedRoute role="recruiter"><RecruiterLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<RecruiterDashboard />} />
            <Route path="jobs" element={<BrowseJobs />} />
            <Route path="submit-candidate/:jobId" element={<SubmitCandidate />} />
            <Route path="my-candidates" element={<MyCandidates />} />
            <Route path="pipeline" element={<RecruiterPipeline />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="profile" element={<MyProfile />} />
          </Route>

          {/* Admin portal */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="approvals" element={<PendingApprovals />} />
            <Route path="subadmins" element={<SubadminManagement />} />
            <Route path="recruiters" element={<RecruiterManagement />} />
            <Route path="recruiters/:id" element={<RecruiterProfile />} />
            <Route path="jobs" element={<AllJobs />} />
            <Route path="candidates" element={<AllCandidates />} />
            <Route path="pipeline" element={<AdminPipeline />} />
            <Route path="profile" element={<MyProfile />} />
          </Route>

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
