import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import Layout from '../../components/Layout';
import { CardSkeleton } from '../../components/Skeleton';

export default function InboxPage() {
  const { data: inbox, isLoading } = useQuery({
    queryKey: ['recruiter-inbox'],
    queryFn: () => api.get('/recruiter/inbox').then((r) => r.data),
  });

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Inbox</h1>
      {isLoading && <CardSkeleton />}
      <div className="space-y-3">
        {inbox?.map((item) => (
          <Link
            key={item.applicationId}
            to={`/recruiter/applications/${item.applicationId}`}
            className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.status === 'agent_intro_sent' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                <span className={item.status === 'agent_intro_sent' ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                  {item.candidate.name} → {item.job.title}
                </span>
              </div>
              <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
      {inbox?.length === 0 && (
        <p className="text-slate-500">No agent introductions yet. Active job postings attract candidates.</p>
      )}
    </Layout>
  );
}
