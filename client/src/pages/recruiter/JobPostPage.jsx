import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import Layout from '../../components/Layout';

export default function JobPostPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', team: '', location: '', summary: '', requirements: '', niceToHaves: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/jobs', {
        ...form,
        requirements: form.requirements.split('\n').map((r) => r.trim()).filter(Boolean),
      });
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not post job');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Post a job</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
        <input placeholder="Team" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
        <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
        <textarea placeholder="Role summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" rows={3} />
        <textarea required placeholder="Requirements (one per line)" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" rows={4} />
        <textarea placeholder="Nice to haves" value={form.niceToHaves} onChange={(e) => setForm({ ...form, niceToHaves: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" rows={2} />
        <button disabled={submitting} className="bg-indigo-600 text-white rounded-lg px-6 py-2 font-medium disabled:opacity-50">
          {submitting ? 'Posting...' : 'Post job'}
        </button>
      </form>
    </Layout>
  );
}
