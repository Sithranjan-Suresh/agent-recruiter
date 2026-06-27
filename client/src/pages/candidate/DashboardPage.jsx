import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import Layout from '../../components/Layout';
import { CardSkeleton } from '../../components/Skeleton';
import StampBadge from '../../components/StampBadge';

const STATUS_LABEL = {
  agent_intro_sent: 'Intro sent',
  recruiter_engaged: 'Engaged',
  interview: 'Interview',
  offer: 'Offer',
  declined: 'Not moving forward',
  hold: 'On hold',
};

const STATUS_TONE = {
  agent_intro_sent: 'ink',
  recruiter_engaged: 'stamp',
  interview: 'seal',
  offer: 'seal',
  declined: 'muted',
  hold: 'stamp',
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: applications, isLoading } = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => api.get('/candidate/applications').then((r) => r.data),
    refetchInterval: 30000,
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => api.post(`/candidate/applications/${id}/revoke`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidate-applications'] }),
  });

  return (
    <Layout>
      <p className="eyebrow mb-1">Case file — open applications</p>
      <h1 className="text-3xl font-display font-semibold text-ink mb-1">Your applications</h1>
      {applications?.length > 0 && (
        <p className="text-sm text-ink-soft mb-8">
          Your agent is active on {applications.length} role{applications.length === 1 ? '' : 's'}.
        </p>
      )}
      {isLoading && <CardSkeleton />}
      <div className="space-y-4">
        {applications?.map((app) => (
          <div key={app.id} className="bg-paper-card border border-line rounded-md p-5 transition-shadow hover:shadow-[2px_3px_0_var(--color-line)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="eyebrow mb-1">{app.job.company}</p>
                <h2 className="font-display font-semibold text-ink text-lg">{app.job.title}</h2>
              </div>
              <StampBadge tone={STATUS_TONE[app.status] || 'muted'}>{STATUS_LABEL[app.status] || app.status}</StampBadge>
            </div>
            <ul className="mt-4 text-xs text-ink-soft space-y-1 border-l-2 border-line pl-3">
              {app.recentEvents.map((ev, i) => (
                <li key={i} className="font-mono">
                  {ev.event_summary} <span className="text-line">·</span> {new Date(ev.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              {app.revoked ? (
                <span className="eyebrow text-ink-soft">Agent access revoked</span>
              ) : (
                <button
                  onClick={() => revokeMutation.mutate(app.id)}
                  disabled={revokeMutation.isPending}
                  className="eyebrow text-stamp-dark hover:text-stamp transition-colors disabled:opacity-50"
                >
                  Revoke agent access
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {applications?.length === 0 && (
        <p className="text-ink-soft">
          You haven't applied to any roles yet.{' '}
          <Link to="/jobs" className="text-stamp-dark font-medium">Browse jobs →</Link>
        </p>
      )}
    </Layout>
  );
}
