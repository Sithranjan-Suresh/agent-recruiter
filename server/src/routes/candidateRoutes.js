import { Router } from 'express';
import { db } from '../db/db.js';
import { decrypt } from '../utils/encrypt.js';
import { accumulateContext, revokeShareLink } from '../services/aicooService.js';
import { formatProfileOverview, formatExperienceEntry } from '../utils/markdown.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/profile', authRequired('candidate'), (req, res, next) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json({
      targetRole: user.target_role || '',
      yearsExp: user.years_exp ?? '',
      skills: user.skills || '',
      goals: user.goals || '',
      portfolioUrl: user.portfolio_url || '',
      workHistory: user.work_history ? JSON.parse(user.work_history) : [],
    });
  } catch (err) {
    next(err);
  }
});

router.post('/profile', authRequired('candidate'), async (req, res, next) => {
  try {
    const { targetRole, yearsExp, skills, workHistory, goals, portfolioUrl } = req.body;
    if (!targetRole || yearsExp === undefined || !Array.isArray(skills) || !Array.isArray(workHistory)) {
      return res.status(400).json({
        error: { message: 'targetRole, yearsExp, skills[], and workHistory[] are required', code: 'VALIDATION' },
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const apiKey = decrypt(user.aicoo_api_key);

    const files = [
      {
        path: `Candidates/${user.id}/Profile/overview.md`,
        content: formatProfileOverview({ name: user.name, targetRole, yearsExp, skills, goals, portfolioUrl }),
      },
      ...workHistory.map((entry) => ({
        path: `Candidates/${user.id}/Profile/experience/${entry.company}.md`,
        content: formatExperienceEntry(entry),
      })),
    ];

    await accumulateContext(apiKey, files);

    db.prepare(
      'UPDATE users SET aicoo_initialized = 1, years_exp = ?, skills = ?, target_role = ?, goals = ?, portfolio_url = ?, work_history = ? WHERE id = ?'
    ).run(yearsExp, skills.join(','), targetRole, goals || '', portfolioUrl || '', JSON.stringify(workHistory), user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/applications', authRequired('candidate'), (req, res, next) => {
  try {
    const rows = db
      .prepare(
        `SELECT a.id, a.status, a.created_at as createdAt, a.share_link_id as shareLinkId, a.revoked, j.title as jobTitle,
                u.company as company
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         JOIN users u ON u.id = j.recruiter_id
         WHERE a.candidate_id = ?
         ORDER BY a.created_at DESC`
      )
      .all(req.user.id);

    const result = rows.map((row) => {
      const events = db
        .prepare('SELECT event_type, event_summary, created_at FROM agent_events WHERE application_id = ? ORDER BY created_at DESC')
        .all(row.id);
      return {
        id: row.id,
        job: { title: row.jobTitle, company: row.company },
        status: row.status,
        createdAt: row.createdAt,
        revoked: !!row.revoked,
        recentEvents: events,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/applications/:id/revoke', authRequired('candidate'), async (req, res, next) => {
  try {
    const application = db
      .prepare('SELECT * FROM applications WHERE id = ? AND candidate_id = ?')
      .get(req.params.id, req.user.id);
    if (!application) {
      return res.status(404).json({ error: { message: 'Application not found', code: 'NOT_FOUND' } });
    }
    if (application.revoked) {
      return res.status(409).json({ error: { message: 'Share link already revoked', code: 'ALREADY_REVOKED' } });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const apiKey = decrypt(user.aicoo_api_key);
    if (application.share_link_id) {
      await revokeShareLink(apiKey, application.share_link_id);
    }

    db.prepare('UPDATE applications SET revoked = 1 WHERE id = ?').run(application.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
