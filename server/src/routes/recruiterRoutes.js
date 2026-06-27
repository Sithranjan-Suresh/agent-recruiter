import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/db.js';
import { decrypt } from '../utils/encrypt.js';
import { chatWithAgent, accumulateContext } from '../services/aicooService.js';
import { formatCompanyOverview } from '../utils/markdown.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/onboarding', authRequired('recruiter'), async (req, res, next) => {
  try {
    const { teamDescription } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const apiKey = decrypt(user.aicoo_api_key);
    await accumulateContext(apiKey, [
      {
        path: `Recruiters/${user.id}/Company/overview.md`,
        content: formatCompanyOverview({ name: user.name, company: user.company, title: req.body.title, teamDescription }),
      },
    ]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/inbox', authRequired('recruiter'), (req, res, next) => {
  try {
    const rows = db
      .prepare(
        `SELECT a.id as applicationId, a.status, a.created_at as createdAt, a.agent_url as agentUrl,
                c.name as candidateName, j.title as jobTitle
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         JOIN users c ON c.id = a.candidate_id
         WHERE j.recruiter_id = ?
         ORDER BY a.created_at DESC`
      )
      .all(req.user.id);
    res.json(
      rows.map((r) => ({
        applicationId: r.applicationId,
        candidate: { name: r.candidateName },
        job: { title: r.jobTitle },
        status: r.status,
        agentUrl: r.agentUrl,
        createdAt: r.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/applications/:id/chat-token', authRequired('recruiter'), (req, res, next) => {
  try {
    const row = db
      .prepare(
        `SELECT a.*, j.recruiter_id as recruiterId FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?`
      )
      .get(req.params.id);
    if (!row || row.recruiterId !== req.user.id) {
      return res.status(404).json({ error: { message: 'Application not found', code: 'NOT_FOUND' } });
    }
    if (row.revoked) {
      return res.status(410).json({ error: { message: 'This link has expired', code: 'LINK_REVOKED' } });
    }

    if (row.status === 'agent_intro_sent') {
      db.prepare(`UPDATE applications SET status = 'recruiter_engaged' WHERE id = ?`).run(row.id);
      db.prepare(`INSERT INTO agent_events (id, application_id, event_type, event_summary) VALUES (?, ?, 'recruiter_opened', 'Recruiter opened agent chat')`).run(
        uuid(),
        row.id
      );
    }

    res.json({ agentUrl: row.agent_url });
  } catch (err) {
    next(err);
  }
});

router.post('/applications/:id/chat', authRequired('recruiter'), async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const row = db
      .prepare(
        `SELECT a.*, j.recruiter_id as recruiterId FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?`
      )
      .get(req.params.id);
    if (!row || row.recruiterId !== req.user.id) {
      return res.status(404).json({ error: { message: 'Application not found', code: 'NOT_FOUND' } });
    }
    if (row.revoked) {
      return res.status(410).json({ error: { message: 'This link has expired', code: 'LINK_REVOKED' } });
    }

    const candidate = db.prepare('SELECT aicoo_api_key FROM users WHERE id = ?').get(row.candidate_id);
    const candidateApiKey = decrypt(candidate.aicoo_api_key);

    const upstream = await chatWithAgent(candidateApiKey, message, conversationId);

    db.prepare(
      `INSERT INTO agent_events (id, application_id, event_type, event_summary) VALUES (?, ?, 'question_asked', ?)`
    ).run(uuid(), row.id, 'Recruiter asked a question');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    upstream.body.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
