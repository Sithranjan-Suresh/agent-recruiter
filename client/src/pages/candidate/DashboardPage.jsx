import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import Layout from '../../components/Layout';
import { CardSkeleton } from '../../components/Skeleton';

const STATUS_LABEL = {
  agent_intro_sent: 'Agent intro sent',
  recruiter_engaged: 'Recruiter engaged',
  interview: 'Interview',
  offer: 'Offer',
  declined: 'Not moving forward',
  hold: 'On hold',
};

const STATUS_COLOR = {
  agent_intro_sent: 'bg-blue-100 text-blue-700',
  recruiter_engaged: 'bg-amber-100 text-amber-700',
  interview: 'bg-green-100 text-green-700',
  offer: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-slate-200 text-slate-600',
  hold: 'bg-yellow-100 text-yellow-700',
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
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Your applications</h1>
      {applications?.length > 0 && (
        <p className="text-sm text-slate-500 mb-6">Your agent is active on {applications.length} role{applications.length === 1 ? '' : 's'}.</p>
      )}
      {isLoading && <CardSkeleton />}
      <div className="space-y-4">
        {applications?.map((app) => (
          <div key={app.id} className="bg-white rounded-xl shadow-sm p-5 transition-shadow hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-slate-900">{app.job.title}</h2>
                <p className="text-sm text-slate-500">{app.job.company}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[app.status] || 'bg-slate-100 text-slate-600'}`}>
                {STATUS_LABEL[app.status] || app.status}
              </span>
            </div>
            <ul className="mt-3 text-xs text-slate-500 space-y-1">
              {app.recentEvents.map((ev, i) => (
                <li key={i}>{ev.event_summary} · {new Date(ev.created_at).toLocaleString()}</li>
              ))}
            </ul>
            <div className="mt-3">
              {app.revoked ? (
                <span className="text-xs text-slate-400">Agent access revoked</span>
              ) : (
                <button
                  onClick={() => revokeMutation.mutate(app.id)}
                  disabled={revokeMutation.isPending}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  Revoke agent access
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {applications?.length === 0 && (
        <p className="text-slate-500">
          You haven't applied to any roles yet.{' '}
          <Link to="/jobs" className="text-indigo-600">Browse jobs →</Link>
        </p>
      )}
    </Layout>
  );
}
