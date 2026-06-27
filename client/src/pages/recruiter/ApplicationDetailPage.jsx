import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import Layout from '../../components/Layout';

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
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => {
          const displayText = m.role === 'agent' ? cleanAgentText(m.text) : m.text;
          return (
            <div key={i} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'recruiter' ? 'bg-indigo-600 text-white ml-auto' : 'bg-slate-100 text-slate-800'}`}>
              {displayText || (streaming && i === messages.length - 1 ? <span className="animate-pulse">●●●</span> : '')}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="border-t border-slate-200 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the candidate's agent a question..."
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <button disabled={streaming} className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors">
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
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">{candidateName}</h2>
      </div>
      {confirmation && <p className="text-sm text-green-600">{confirmation}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        <button
          disabled={isDecided}
          onClick={() => decisionMutation.mutate('interview')}
          className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          Move to Interview
        </button>
        <button
          disabled={isDecided}
          onClick={() => decisionMutation.mutate('hold')}
          className="w-full bg-yellow-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          Hold
        </button>
        <button
          disabled={isDecided}
          onClick={() => decisionMutation.mutate('declined')}
          className="w-full bg-slate-400 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          Not Moving Forward
        </button>
      </div>
      {isDecided && !confirmation && <p className="text-sm text-slate-500">Decision: {decidedStatus}</p>}
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
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">
        {current ? `${current.candidate.name} — ${current.job.title}` : 'Application'}
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
