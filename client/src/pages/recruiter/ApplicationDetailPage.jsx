import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import Layout from '../../components/Layout';
import StampBadge from '../../components/StampBadge';

const STORAGE_KEY = (appId) => `agentrecruit_chat_${appId}`;

function loadHistory(appId) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(appId)) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(appId, messages) {
  localStorage.setItem(STORAGE_KEY(appId), JSON.stringify(messages));
}

function cleanAgentText(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<suggestions>[\s\S]*?<\/suggestions>/g, '')
    .replace(/<\/?think>/g, '')
    .replace(/<\/?suggestions>/g, '')
    .trim();
}

function AgentChatPanel({ applicationId }) {
  const [messages, setMessages] = useState(() => loadHistory(applicationId));
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const conversationIdRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/recruiter/applications/${applicationId}/chat-token`).catch(() => {});
  }, [applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage = { role: 'recruiter', text: input };
    const nextMessages = [...messages, userMessage, { role: 'agent', text: '' }];
    setMessages(nextMessages);
    saveHistory(applicationId, nextMessages);
    setInput('');
    setStreaming(true);

    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    try {
      const res = await fetch(`${baseURL}/api/recruiter/applications/${applicationId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage.text, conversationId: conversationIdRef.current }),
      });

      if (res.status === 404 || res.status === 410) {
        throw new Error('EXPIRED');
      }
      if (res.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (!res.ok) {
        throw new Error('FAILED');
      }

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
            if (event.conversationId) conversationIdRef.current = event.conversationId;
            if (event.type === 'text-delta') {
              agentText += event.textDelta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'agent', text: agentText };
                saveHistory(applicationId, updated);
                return updated;
              });
            }
          } catch {
            // non-JSON line, skip
          }
        }
      }
    } catch (err) {
      const errorText =
        err.message === 'EXPIRED'
          ? 'This link has expired.'
          : err.message === 'RATE_LIMITED'
          ? 'Agent is busy — try again in a moment.'
          : 'Agent is busy — try again in a moment.';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'agent', text: errorText };
        saveHistory(applicationId, updated);
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-paper-card border border-line rounded-md">
      <div className="eyebrow border-b border-line px-4 py-2.5">Transcript — live</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="eyebrow text-ink-soft/70">No questions asked yet. Try "What's their strongest project?"</p>
        )}
        {messages.map((m, i) => {
          const displayText = m.role === 'agent' ? cleanAgentText(m.text) : m.text;
          const isRecruiter = m.role === 'recruiter';
          return (
            <div key={i} className={`max-w-[85%] ${isRecruiter ? 'ml-auto' : ''}`}>
              <p className={`eyebrow mb-1 ${isRecruiter ? 'text-right' : ''}`}>{isRecruiter ? 'You' : 'Agent'}</p>
              <div
                className={`rounded-sm px-3 py-2 text-sm whitespace-pre-wrap ${
                  isRecruiter ? 'bg-ink text-paper-card' : 'bg-paper border border-line text-ink'
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
          placeholder="Ask the candidate's agent a question…"
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

function DecisionPanel({ applicationId, candidateName, decided, decidedStatus }) {
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState('');

  const [error, setError] = useState('');

  const decisionMutation = useMutation({
    mutationFn: (decision) => api.post(`/applications/${applicationId}/decision`, { decision }),
    onSuccess: () => {
      setError('');
      setConfirmation(`Decision recorded. ${candidateName} notified.`);
      queryClient.invalidateQueries({ queryKey: ['recruiter-inbox'] });
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Could not record decision. Try again.');
    },
  });

  const isDecided = decided || decisionMutation.isSuccess;

  return (
    <div className="bg-paper-card border border-line rounded-md p-5 space-y-4">
      <div>
        <p className="eyebrow mb-1">Subject</p>
        <h2 className="font-display font-semibold text-ink text-lg">{candidateName}</h2>
      </div>
      {confirmation && <p className="text-sm text-seal font-medium">{confirmation}</p>}
      {error && <p className="text-sm text-stamp-dark">{error}</p>}
      <div className="space-y-2 pt-1">
        <button
          disabled={isDecided}
          onClick={() => decisionMutation.mutate('interview')}
          className="stamp-press w-full border-[1.5px] border-seal text-seal rounded-sm py-2 text-sm font-display font-semibold disabled:opacity-40 hover:bg-seal-soft transition-colors"
        >
          Move to Interview
        </button>
        <button
          disabled={isDecided}
          onClick={() => decisionMutation.mutate('hold')}
          className="stamp-press w-full border-[1.5px] border-ink-soft text-ink-soft rounded-sm py-2 text-sm font-display font-semibold disabled:opacity-40 hover:bg-ink/5 transition-colors"
        >
          Hold
        </button>
        <button
          disabled={isDecided}
          onClick={() => decisionMutation.mutate('declined')}
          className="stamp-press w-full border-[1.5px] border-stamp text-stamp-dark rounded-sm py-2 text-sm font-display font-semibold disabled:opacity-40 hover:bg-stamp-soft transition-colors"
        >
          Not Moving Forward
        </button>
      </div>
      {isDecided && !confirmation && <StampBadge tone="muted">Decided — {decidedStatus}</StampBadge>}
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const { data: inbox } = useQuery({
    queryKey: ['recruiter-inbox'],
    queryFn: () => api.get('/recruiter/inbox').then((r) => r.data),
  });

  const current = inbox?.find((a) => a.applicationId === id);
  const decidedStatuses = ['interview', 'hold', 'declined'];

  return (
    <Layout>
      <p className="eyebrow mb-1">{current ? current.job.title : 'Application'}</p>
      <h1 className="text-3xl font-display font-semibold text-ink mb-8">
        {current ? current.candidate.name : 'Loading…'}
      </h1>
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <AgentChatPanel applicationId={id} />
        </div>
        <div className="col-span-2">
          <DecisionPanel
            applicationId={id}
            candidateName={current?.candidate.name || 'Candidate'}
            decided={current && decidedStatuses.includes(current.status)}
            decidedStatus={current?.status}
          />
        </div>
      </div>
    </Layout>
  );
}
