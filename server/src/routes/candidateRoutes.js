import { Router } from 'express';
import { db } from '../db/db.js';
import { decrypt } from '../utils/encrypt.js';
import { accumulateContext } from '../services/aicooService.js';
import { formatProfileOverview, formatExperienceEntry } from '../utils/markdown.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = Router();

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

    db.prepare('UPDATE users SET aicoo_initialized = 1 WHERE id = ?').run(user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/applications', authRequired('candidate'), (req, res, next) => {
  try {
    const rows = db
      .prepare(
        `SELECT a.id, a.status, a.created_at as createdAt, j.title as jobTitle,
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
        recentEvents: events,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
