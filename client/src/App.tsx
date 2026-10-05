
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PostProject } from './pages/PostProject';
import { Navbar } from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProfilePage } from './pages/ProfilePage';
import { Inbox } from './pages/Inbox';
import { Chat } from './pages/Chat';
import { Help } from './pages/Help';
import { ContractDashboard } from './pages/ContractDashboard';
import { MyProjects } from './pages/MyProjects';
import { About } from './pages/About';
import { MembershipPage } from './pages/MembershipPage';
import { ReferralPage } from './pages/ReferralPage';
import { TermsPage } from './pages/TermsPage';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

import { AdminRoute } from './components/AdminRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminProjects } from './pages/admin/AdminProjects';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminVerifications } from './pages/admin/AdminVerifications';
import { AdminDisputes } from './pages/admin/AdminDisputes';
import { AdminSettings } from './pages/admin/AdminSettings';

import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="min-h-screen bg-gray-950">
              <Routes>
                {/* Admin Routes - uses its own Layout */}
                <Route path="/admin" element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="projects" element={<AdminProjects />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="verifications" element={<AdminVerifications />} />
                    <Route path="disputes" element={<AdminDisputes />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Route>

                {/* Main App Routes - uses normal layout styling */}
                <Route element={<><Navbar /><Outlet /></>}>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/post-project" element={<PostProject />} />
                  <Route path="/projects" element={<ProjectList />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:id" element={<ProfilePage />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/messages/:userId" element={<Chat />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/contract" element={<ContractDashboard />} />
                  <Route path="/my-projects" element={<MyProjects />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/membership" element={<MembershipPage />} />
                  <Route path="/referral" element={<ReferralPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
