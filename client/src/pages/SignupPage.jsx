import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('candidate');
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup({ ...form, role });
      navigate(role === 'candidate' ? '/candidate/profile' : '/recruiter/jobs/new');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="case-card pin p-8 w-full max-w-sm space-y-4">
        <p className="eyebrow">Open a file</p>
        <h1 className="text-2xl font-display font-semibold text-ink -mt-1">Sign up</h1>
        <div className="flex gap-1 border border-line rounded-sm p-1">
          {['candidate', 'recruiter'].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                role === r ? 'bg-ink text-paper-card' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {r === 'candidate' ? 'Candidate' : 'Recruiter'}
            </button>
          ))}
        </div>
        {error && <p className="text-stamp-dark text-sm">{error}</p>}
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-line rounded-sm px-3 py-2 bg-white"
        />
        {role === 'recruiter' && (
          <input
            required
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full border border-line rounded-sm px-3 py-2 bg-white"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-line rounded-sm px-3 py-2 bg-white"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border border-line rounded-sm px-3 py-2 bg-white"
        />
        <button
          disabled={loading}
          className="stamp-press w-full font-display font-semibold bg-stamp text-white rounded-sm py-2 disabled:opacity-50 hover:bg-stamp-dark transition-colors"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="text-sm text-ink-soft">
          Already have an account? <Link to="/login" className="text-stamp-dark font-medium">Log in</Link>
        </p>
      </form>
    </div>
  );
}
