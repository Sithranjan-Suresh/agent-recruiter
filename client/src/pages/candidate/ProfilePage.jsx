import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import StampBadge from '../../components/StampBadge';

const emptyExperience = { company: '', title: '', dates: '', summary: '' };
const fieldClass = 'w-full border border-line rounded-sm px-3 py-2 bg-white';
const labelClass = 'eyebrow block mb-1.5';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
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
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get('/candidate/profile')
      .then(({ data }) => {
        if (data.targetRole) {
          setHasExistingProfile(true);
          setForm({
            targetRole: data.targetRole,
            yearsExp: String(data.yearsExp ?? ''),
            skills: data.skills,
            goals: data.goals,
            portfolioUrl: data.portfolioUrl,
          });
          if (data.workHistory?.length) setWorkHistory(data.workHistory);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

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
      updateUser({ aicooInitialized: true });
      setSuccess(true);
      setTimeout(() => navigate('/jobs'), 1300);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error?.message || 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="text-center py-24">
          <div className="inline-block">
            <StampBadge tone="seal">File opened — agent ready</StampBadge>
          </div>
          <p className="text-ink-soft mt-4">Redirecting you to the job board…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <p className="eyebrow mb-1">{hasExistingProfile ? 'Case file' : 'New file'}</p>
      <h1 className="text-3xl font-display font-semibold text-ink mb-8">
        {hasExistingProfile ? 'Update your profile' : 'Set up your profile'}
      </h1>
      {!loaded ? (
        <p className="text-ink-soft">Loading…</p>
      ) : (
      <form onSubmit={onSubmit} className="case-card pin space-y-6 p-6">
        {errors.submit && <p className="text-stamp-dark text-sm">{errors.submit}</p>}

        <div>
          <label className={labelClass}>Target role</label>
          <input value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} className={fieldClass} />
          {errors.targetRole && <p className="text-stamp-dark text-xs mt-1">{errors.targetRole}</p>}
        </div>

        <div>
          <label className={labelClass}>Years of experience</label>
          <input
            type="number"
            value={form.yearsExp}
            onChange={(e) => setForm({ ...form, yearsExp: e.target.value })}
            className={fieldClass}
          />
          {errors.yearsExp && <p className="text-stamp-dark text-xs mt-1">{errors.yearsExp}</p>}
        </div>

        <div>
          <label className={labelClass}>Skills (comma-separated)</label>
          <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className={fieldClass} />
          {errors.skills && <p className="text-stamp-dark text-xs mt-1">{errors.skills}</p>}
        </div>

        <div>
          <label className={labelClass}>Goals / summary</label>
          <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} className={fieldClass} rows={3} />
        </div>

        <div>
          <label className={labelClass}>Portfolio URL (optional)</label>
          <input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Work history</label>
          <div className="space-y-3">
            {workHistory.map((entry, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 border border-line rounded-sm p-3 bg-paper">
                <input
                  placeholder="Company"
                  value={entry.company}
                  onChange={(e) => updateExperience(i, 'company', e.target.value)}
                  className="border border-line rounded-sm px-3 py-2 bg-white"
                />
                <input
                  placeholder="Title"
                  value={entry.title}
                  onChange={(e) => updateExperience(i, 'title', e.target.value)}
                  className="border border-line rounded-sm px-3 py-2 bg-white"
                />
                <input
                  placeholder="Dates"
                  value={entry.dates}
                  onChange={(e) => updateExperience(i, 'dates', e.target.value)}
                  className="border border-line rounded-sm px-3 py-2 col-span-2 bg-white"
                />
                <textarea
                  placeholder="Summary"
                  value={entry.summary}
                  onChange={(e) => updateExperience(i, 'summary', e.target.value)}
                  className="border border-line rounded-sm px-3 py-2 col-span-2 bg-white"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={addExperience} className="eyebrow text-stamp-dark mt-2 hover:text-stamp transition-colors">
            + Add another role
          </button>
        </div>

        <button
          disabled={submitting}
          className="stamp-press font-display font-semibold bg-stamp text-white rounded-sm px-6 py-2 disabled:opacity-50 hover:bg-stamp-dark transition-colors"
        >
          {submitting ? 'Setting up your agent…' : 'Save profile'}
        </button>
      </form>
      )}
    </Layout>
  );
}
