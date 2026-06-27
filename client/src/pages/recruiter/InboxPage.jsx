import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import Layout from '../../components/Layout';
import { CardSkeleton } from '../../components/Skeleton';
import StampBadge from '../../components/StampBadge';

export default function InboxPage() {
  const { data: inbox, isLoading } = useQuery({
    queryKey: ['recruiter-inbox'],
    queryFn: () => api.get('/recruiter/inbox').then((r) => r.data),
  });

  return (
    <Layout>
      <p className="eyebrow mb-1">Incoming — agent introductions</p>
      <h1 className="text-3xl font-display font-semibold text-ink mb-8">Inbox</h1>
      {isLoading && <CardSkeleton />}
      <div className="space-y-3">
        {inbox?.map((item) => (
          <Link
            key={item.applicationId}
            to={`/recruiter/applications/${item.applicationId}`}
            className="block bg-paper-card border border-line rounded-md p-4 hover:shadow-[2px_3px_0_var(--color-line)] transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {item.status === 'agent_intro_sent' && <span className="w-2 h-2 rounded-full bg-stamp shrink-0" />}
                <span className={item.status === 'agent_intro_sent' ? 'font-display font-semibold text-ink' : 'text-ink-soft'}>
                  {item.candidate.name} <span className="text-line">→</span> {item.job.title}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {item.match && <StampBadge tone={item.match.tone}>{item.match.label}</StampBadge>}
                <span className="eyebrow">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {inbox?.length === 0 && (
        <p className="text-ink-soft">No agent introductions yet. Active job postings attract candidates.</p>
      )}
    </Layout>
  );
}
