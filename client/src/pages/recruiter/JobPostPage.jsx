import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import Layout from '../../components/Layout';

const fieldClass = 'w-full border border-line rounded-sm px-3 py-2 bg-white';

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
      <p className="eyebrow mb-1">New requisition</p>
      <h1 className="text-3xl font-display font-semibold text-ink mb-8">Post a job</h1>
      <form onSubmit={onSubmit} className="case-card pin space-y-4 p-6">
        {error && <p className="text-stamp-dark text-sm">{error}</p>}
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={fieldClass} />
        <input placeholder="Team" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className={fieldClass} />
        <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={fieldClass} />
        <textarea placeholder="Role summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={fieldClass} rows={3} />
        <textarea required placeholder="Requirements (one per line)" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className={fieldClass} rows={4} />
        <textarea placeholder="Nice to haves" value={form.niceToHaves} onChange={(e) => setForm({ ...form, niceToHaves: e.target.value })} className={fieldClass} rows={2} />
        <button
          disabled={submitting}
          className="stamp-press font-display font-semibold bg-stamp text-white rounded-sm px-6 py-2 disabled:opacity-50 hover:bg-stamp-dark transition-colors"
        >
          {submitting ? 'Posting…' : 'Post job'}
        </button>
      </form>
    </Layout>
  );
}
