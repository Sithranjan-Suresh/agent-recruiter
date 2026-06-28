import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Tab({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`eyebrow whitespace-nowrap px-2 sm:px-3 py-2 rounded-t-md border border-b-0 transition-colors ${
        active
          ? 'bg-paper-card border-line text-ink relative top-px'
          : 'border-transparent text-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="px-4 sm:px-6 pt-4">
        <div className="max-w-5xl mx-auto flex items-end justify-between gap-3">
          <Link to="/jobs" className="font-typewriter text-lg text-ink pb-2 shrink-0">
            AgentRecruit<span className="text-stamp">.</span>
          </Link>
          <nav className="flex items-end gap-1 overflow-x-auto">
            <Tab to="/jobs">Jobs</Tab>
            {user?.role === 'candidate' && (
              <>
                <Tab to="/candidate/dashboard">Dashboard</Tab>
                <Tab to="/candidate/profile">Profile</Tab>
              </>
            )}
            {user?.role === 'recruiter' && (
              <>
                <Tab to="/recruiter/inbox">Inbox</Tab>
                <Tab to="/recruiter/jobs/new">Post a Job</Tab>
              </>
            )}
            {user ? (
              <button onClick={logout} className="eyebrow whitespace-nowrap px-2 sm:px-3 py-2 text-ink-soft hover:text-stamp transition-colors shrink-0">
                Log out
              </button>
            ) : (
              <Tab to="/login">Log in</Tab>
            )}
          </nav>
        </div>
        <div className="max-w-5xl mx-auto border-b border-line" />
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">{children}</main>
    </div>
  );
}
