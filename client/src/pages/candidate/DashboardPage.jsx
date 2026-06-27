import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import Layout from '../../components/Layout';
import { CardSkeleton } from '../../components/Skeleton';
import StampBadge from '../../components/StampBadge';

function cleanAgentText(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<suggestions>[\s\S]*?<\/suggestions>/g, '')
    .trim();
}

function CoachPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage = { role: 'you', text: input };
    setMessages((prev) => [...prev, userMessage, { role: 'agent', text: '' }]);
    setInput('');
    setStreaming(true);

    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    try {
      const res = await fetch(`${baseURL}/api/candidate/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage.text }),
      });
      if (!res.ok) throw new Error('FAILED');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let agentText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'text-delta') {
              agentText += event.textDelta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'agent', text: agentText };
                return updated;
              });
            }
          } catch {
            // non-JSON line, skip
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'agent', text: 'Agent is busy — try again in a moment.' };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="bg-paper-card border border-line rounded-md mt-8">
      <div className="eyebrow border-b border-line px-4 py-2.5">Ask your own agent</div>
      <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
        {messages.length === 0 && (
          <p className="eyebrow text-ink-soft/70">
            Try "What's the weakest part of my profile for a Senior ML Engineer role?"
          </p>
        )}
        {messages.map((m, i) => {
          const displayText = m.role === 'agent' ? cleanAgentText(m.text) : m.text;
          const isYou = m.role === 'you';
          return (
            <div key={i} className={`max-w-[85%] ${isYou ? 'ml-auto' : ''}`}>
              <p className={`eyebrow mb-1 ${isYou ? 'text-right' : ''}`}>{isYou ? 'You' : 'Your agent'}</p>
              <div
                className={`rounded-sm px-3 py-2 text-sm whitespace-pre-wrap ${
                  isYou ? 'bg-ink text-paper-card' : 'bg-paper border border-line text-ink'
                }`}
              >
                {displayText || (streaming && i === messages.length - 1 ? <span className="animate-pulse font-mono">···</span> : '')}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="border-t border-line p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your agent about your own profile…"
          className="flex-1 border border-line rounded-sm px-3 py-2 text-sm bg-white"
        />
        <button
          disabled={streaming}
          className="stamp-press font-display text-sm font-semibold bg-stamp text-white rounded-sm px-4 py-2 disabled:opacity-50 hover:bg-stamp-dark transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

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
    refetchInterval: 4000,
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
                <li key={i} className={`font-mono ${i === 0 ? 'text-ink font-medium' : ''}`}>
                  {i === 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-stamp mr-1.5 align-middle animate-pulse" />}
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
      <CoachPanel />
    </Layout>
  );
}
