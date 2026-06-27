import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { CardSkeleton } from '../components/Skeleton';
import StampBadge from '../components/StampBadge';

function ApplyButton({ jobId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  const applyMutation = useMutation({
    mutationFn: () => api.post('/applications', { jobId }),
    onSuccess: () => {
      setRateLimited(false);
      setToast('Your agent introduced itself to the recruiter');
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] });
    },
    onError: (err) => {
      if (err.response?.status === 429) {
        setRateLimited(true);
        setToast('Agent is busy — try again in a moment');
      } else {
        setToast(err.response?.data?.error?.message || 'Something went wrong');
      }
    },
  });

  if (!user || user.role !== 'candidate') return null;

  const profileIncomplete = !user.aicooInitialized;

  if (applyMutation.isSuccess) {
    return (
      <div className="text-right">
        <StampBadge tone="seal">Agent active</StampBadge>
        {toast && <p className="text-xs text-ink-soft mt-1.5">{toast}</p>}
      </div>
    );
  }

  return (
    <div className="text-right">
      <button
        onClick={() => applyMutation.mutate()}
        disabled={profileIncomplete || applyMutation.isPending}
        title={profileIncomplete ? 'Complete your profile first' : undefined}
        className="stamp-press font-display text-sm font-semibold bg-stamp text-white rounded-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stamp-dark transition-colors"
      >
        {applyMutation.isPending ? 'Setting up your agent…' : 'Apply via Agent'}
      </button>
      {profileIncomplete && <p className="eyebrow mt-1.5 text-ink-soft">Complete your profile first</p>}
      {toast && <p className="text-xs text-ink-soft mt-1.5">{toast}</p>}
      {rateLimited && (
        <button onClick={() => applyMutation.mutate()} className="eyebrow text-stamp-dark underline mt-1 block ml-auto">
          Retry
        </button>
      )}
    </div>
  );
}

export default function JobBoardPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs').then((r) => r.data),
  });

  return (
    <Layout>
      <p className="eyebrow mb-1">Open requisitions</p>
      <h1 className="text-3xl font-display font-semibold text-ink mb-8">Roles taking agent introductions</h1>
      {isLoading && <CardSkeleton />}
      <div className="grid gap-4">
        {jobs?.map((job) => (
          <div
            key={job.id}
            className="bg-paper-card border border-line rounded-md p-5 flex justify-between items-start gap-6 transition-shadow hover:shadow-[2px_3px_0_var(--color-line)]"
          >
            <div>
              <p className="eyebrow mb-1">File — {job.recruiter.company}</p>
              <h2 className="font-display text-lg font-semibold text-ink">{job.title}</h2>
              <p className="text-sm text-ink-soft mt-0.5">{job.location}</p>
              <ul className="text-sm text-ink mt-3 space-y-1">
                {job.requirements.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-stamp">—</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <ApplyButton jobId={job.id} />
          </div>
        ))}
        {jobs?.length === 0 && <p className="text-ink-soft">No open roles right now.</p>}
      </div>
    </Layout>
  );
}
