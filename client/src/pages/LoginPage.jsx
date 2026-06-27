import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const redirect = params.get('redirect');
      navigate(redirect || (user.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/inbox'));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="bg-paper-card border border-line rounded-md p-8 w-full max-w-sm space-y-4">
        <p className="eyebrow">Access — Sign in</p>
        <h1 className="text-2xl font-display font-semibold text-ink -mt-1">Log in</h1>
        {error && <p className="text-stamp-dark text-sm">{error}</p>}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-line rounded-sm px-3 py-2 bg-white focus:outline-none focus-visible:outline-2 focus-visible:outline-stamp"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-line rounded-sm px-3 py-2 bg-white focus:outline-none focus-visible:outline-2 focus-visible:outline-stamp"
        />
        <button
          disabled={loading}
          className="stamp-press w-full font-display font-semibold bg-ink text-paper-card rounded-sm py-2 disabled:opacity-50 hover:bg-stamp-dark transition-colors"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-sm text-ink-soft">
          No account? <Link to="/signup" className="text-stamp-dark font-medium">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
