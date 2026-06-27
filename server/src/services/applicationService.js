import { v4 as uuid } from 'uuid';
import { db } from '../db/db.js';
import { decrypt } from '../utils/encrypt.js';
import { createShareLink, accumulateContext, chatWithAgentText } from './aicooService.js';
import { formatDecision } from '../utils/markdown.js';

export async function applyToJob(candidateId, jobId) {
  const existing = db.prepare('SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?').get(candidateId, jobId);
  if (existing) {
    const err = new Error('Your agent is already active for this role');
    err.status = 409;
    throw err;
  }

  const candidate = db.prepare('SELECT * FROM users WHERE id = ?').get(candidateId);
  const job = db.prepare('SELECT j.*, u.id as recruiterId, u.company FROM jobs j JOIN users u ON u.id = j.recruiter_id WHERE j.id = ?').get(jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.status = 404;
    throw err;
  }

  const candidateApiKey = decrypt(candidate.aicoo_api_key);

  const shareResult = await createShareLink(candidateApiKey, {
    scope: 'all',
    access: 'read',
    label: `${candidate.name} → ${job.title} at ${job.company}`,
    expiresIn: '7d',
  });
  const shareLink = shareResult.shareLink;

  const applicationId = uuid();
  db.prepare(
    `INSERT INTO applications (id, candidate_id, job_id, status, share_link_id, share_link_url, agent_url)
     VALUES (?, ?, ?, 'agent_intro_sent', ?, ?, ?)`
  ).run(applicationId, candidateId, jobId, shareLink.id, shareLink.url, shareLink.url);

  // Recruiter notification is an in-app event, not a live send_message_to_human call:
  // this demo simulates per-user workspaces with one shared Aicoo key, so there is no
  // second real Aicoo identity to address a cross-user message to.
  db.prepare(
    `INSERT INTO agent_events (id, application_id, event_type, event_summary) VALUES (?, ?, 'intro_sent', ?)`
  ).run(uuid(), applicationId, `Agent intro sent for ${job.title}`);

  return db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);
}

export async function recordDecision(recruiterId, applicationId, decision) {
  const statusMap = { interview: 'interview', hold: 'hold', declined: 'declined' };
  if (!statusMap[decision]) {
    const err = new Error('Invalid decision value');
    err.status = 400;
    throw err;
  }

  const row = db
    .prepare(
      `SELECT a.*, j.recruiter_id as recruiterId, j.title as jobTitle, u.company as recruiterCompany
       FROM applications a JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = j.recruiter_id
       WHERE a.id = ?`
    )
    .get(applicationId);

  if (!row) {
    const err = new Error('Application not found');
    err.status = 404;
    throw err;
  }
  if (row.recruiterId !== recruiterId) {
    const err = new Error('You do not own this job posting');
    err.status = 403;
    throw err;
  }
  if (row.decided_at) {
    const err = new Error('Decision already recorded for this application');
    err.status = 409;
    throw err;
  }

  const candidate = db.prepare('SELECT aicoo_api_key FROM users WHERE id = ?').get(row.candidate_id);
  const candidateApiKey = decrypt(candidate.aicoo_api_key);

  let debrief = '';
  try {
    debrief = await chatWithAgentText(
      candidateApiKey,
      `[Internal task — do not address a recruiter directly, this is not a chat reply.] Write a 2-3 sentence internal hiring debrief summarizing why this candidate is or isn't a strong fit for "${row.jobTitle}", based only on their own profile/experience notes. This is for internal handoff between reviewers, not a recruiter-facing answer.`
    );
  } catch {
    debrief = '';
  }

  await accumulateContext(candidateApiKey, [
    {
      path: `Candidates/${row.candidate_id}/Applications/${row.jobTitle}_decision.md`,
      content: formatDecision(decision, row.recruiterCompany, debrief),
    },
  ]);

  db.prepare(`UPDATE applications SET status = ?, decided_at = datetime('now') WHERE id = ?`).run(statusMap[decision], applicationId);
  db.prepare(`INSERT INTO agent_events (id, application_id, event_type, event_summary) VALUES (?, ?, 'decision_made', ?)`).run(
    uuid(),
    applicationId,
    `Decision: ${decision}`
  );
  if (debrief) {
    db.prepare(`INSERT INTO agent_events (id, application_id, event_type, event_summary) VALUES (?, ?, 'decision_debrief', ?)`).run(
      uuid(),
      applicationId,
      `Agent debrief: ${debrief}`
    );
  }

  return { ...db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId), debrief };
}
