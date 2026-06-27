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
      const user = await signup({ ...form, role });
      navigate(role === 'candidate' ? '/candidate/profile' : '/recruiter/jobs/new');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={onSubmit} className="bg-white shadow-md rounded-xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Sign up</h1>
        <div className="flex gap-2">
          {['candidate', 'recruiter'].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg border ${role === r ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-700'}`}
            >
              {r === 'candidate' ? 'Candidate' : 'Recruiter'}
            </button>
          ))}
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
        {role === 'recruiter' && (
          <input
            required
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
        <button disabled={loading} className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-50">
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
        <p className="text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-600">Log in</Link>
        </p>
      </form>
    </div>
  );
}
