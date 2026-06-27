import fetch from 'node-fetch';

const BASE_URL = process.env.AICOO_BASE_URL || 'https://api.aicoo.dev';

async function aicooRequest(apiKey, path, { method = 'GET', body, stream = false } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Aicoo API error ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }

  if (stream) return res;
  if (res.status === 204) return null;
  return res.json();
}

export function initWorkspace(apiKey) {
  return aicooRequest(apiKey, '/api/v1/init', { method: 'POST', body: {} });
}

export function accumulateContext(apiKey, files) {
  return aicooRequest(apiKey, '/api/v1/accumulate', { method: 'POST', body: { files } });
}

export function createShareLink(apiKey, options) {
  return aicooRequest(apiKey, '/api/v1/share/create', { method: 'POST', body: options });
}

export function revokeShareLink(apiKey, linkId) {
  return aicooRequest(apiKey, `/api/v1/share/${linkId}`, { method: 'DELETE' });
}

export function sendMessageToUser(apiKey, recipientId, message) {
  return aicooRequest(apiKey, '/api/v1/tools', {
    method: 'POST',
    body: { tool: 'send_message_to_human', params: { recipientId, message } },
  });
}

export function chatWithAgent(apiKey, message, conversationId) {
  return aicooRequest(apiKey, '/api/v1/chat', {
    method: 'POST',
    body: { message, conversationId },
    stream: true,
  });
}
