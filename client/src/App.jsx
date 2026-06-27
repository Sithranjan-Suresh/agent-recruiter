import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/AuthGuard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import JobBoardPage from './pages/JobBoardPage';
import ProfilePage from './pages/candidate/ProfilePage';
import DashboardPage from './pages/candidate/DashboardPage';
import JobPostPage from './pages/recruiter/JobPostPage';
import InboxPage from './pages/recruiter/InboxPage';
import ApplicationDetailPage from './pages/recruiter/ApplicationDetailPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/jobs" element={<JobBoardPage />} />
            <Route
              path="/candidate/profile"
              element={
                <AuthGuard role="candidate">
                  <ProfilePage />
                </AuthGuard>
              }
            />
            <Route
              path="/candidate/dashboard"
              element={
                <AuthGuard role="candidate">
                  <DashboardPage />
                </AuthGuard>
              }
            />
            <Route
              path="/recruiter/jobs/new"
              element={
                <AuthGuard role="recruiter">
                  <JobPostPage />
                </AuthGuard>
              }
            />
            <Route
              path="/recruiter/inbox"
              element={
                <AuthGuard role="recruiter">
                  <InboxPage />
                </AuthGuard>
              }
            />
            <Route
              path="/recruiter/applications/:id"
              element={
                <AuthGuard role="recruiter">
                  <ApplicationDetailPage />
                </AuthGuard>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
