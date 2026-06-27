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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={onSubmit} className="bg-white shadow-md rounded-xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Log in</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        <p className="text-sm text-slate-500">
          No account? <Link to="/signup" className="text-indigo-600">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
