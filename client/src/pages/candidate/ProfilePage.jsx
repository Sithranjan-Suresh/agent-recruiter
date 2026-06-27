import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import Layout from '../../components/Layout';

const emptyExperience = { company: '', title: '', dates: '', summary: '' };

export default function ProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    targetRole: '',
    yearsExp: '',
    skills: '',
    goals: '',
    portfolioUrl: '',
  });
  const [workHistory, setWorkHistory] = useState([{ ...emptyExperience }]);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateExperience(index, field, value) {
    setWorkHistory((prev) => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  }

  function addExperience() {
    setWorkHistory((prev) => [...prev, { ...emptyExperience }]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.targetRole) newErrors.targetRole = 'Required';
    if (!form.yearsExp) newErrors.yearsExp = 'Required';
    if (!form.skills) newErrors.skills = 'Required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.post('/candidate/profile', {
        targetRole: form.targetRole,
        yearsExp: Number(form.yearsExp),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        workHistory: workHistory.filter((w) => w.company),
        goals: form.goals,
        portfolioUrl: form.portfolioUrl || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/jobs'), 1200);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error?.message || 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-semibold text-slate-900">Your agent is ready</h1>
          <p className="text-slate-500 mt-2">Redirecting you to the job board...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Set up your profile</h1>
      <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
        {errors.submit && <p className="text-red-600 text-sm">{errors.submit}</p>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target role</label>
          <input
            value={form.targetRole}
            onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          {errors.targetRole && <p className="text-red-600 text-xs mt-1">{errors.targetRole}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Years of experience</label>
          <input
            type="number"
            value={form.yearsExp}
            onChange={(e) => setForm({ ...form, yearsExp: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          {errors.yearsExp && <p className="text-red-600 text-xs mt-1">{errors.yearsExp}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma-separated)</label>
          <input
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          {errors.skills && <p className="text-red-600 text-xs mt-1">{errors.skills}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Goals / summary</label>
          <textarea
            value={form.goals}
            onChange={(e) => setForm({ ...form, goals: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Portfolio URL (optional)</label>
          <input
            value={form.portfolioUrl}
            onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <h2 className="text-sm font-medium text-slate-700 mb-2">Work history</h2>
          <div className="space-y-3">
            {workHistory.map((entry, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 border border-slate-200 rounded-lg p-3">
                <input
                  placeholder="Company"
                  value={entry.company}
                  onChange={(e) => updateExperience(i, 'company', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2"
                />
                <input
                  placeholder="Title"
                  value={entry.title}
                  onChange={(e) => updateExperience(i, 'title', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2"
                />
                <input
                  placeholder="Dates"
                  value={entry.dates}
                  onChange={(e) => updateExperience(i, 'dates', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 col-span-2"
                />
                <textarea
                  placeholder="Summary"
                  value={entry.summary}
                  onChange={(e) => updateExperience(i, 'summary', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 col-span-2"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={addExperience} className="text-indigo-600 text-sm mt-2">
            + Add another role
          </button>
        </div>

        <button disabled={submitting} className="bg-indigo-600 text-white rounded-lg px-6 py-2 font-medium disabled:opacity-50">
          {submitting ? 'Setting up your agent...' : 'Save profile'}
        </button>
      </form>
    </Layout>
  );
}
