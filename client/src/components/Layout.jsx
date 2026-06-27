import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <Link to="/jobs" className="font-semibold text-indigo-600 text-lg">
          AgentRecruit
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link to="/jobs">Jobs</Link>
          {user?.role === 'candidate' && <Link to="/candidate/dashboard">Dashboard</Link>}
          {user?.role === 'recruiter' && (
            <>
              <Link to="/recruiter/inbox">Inbox</Link>
              <Link to="/recruiter/jobs/new">Post a Job</Link>
            </>
          )}
          {user ? (
            <button onClick={logout} className="text-slate-500 hover:text-slate-800">
              Log out
            </button>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
