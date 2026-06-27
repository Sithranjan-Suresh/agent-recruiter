import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/db.js';
import { decrypt } from '../utils/encrypt.js';
import { accumulateContext } from '../services/aicooService.js';
import { formatJobPosting } from '../utils/markdown.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const rows = db
      .prepare(
        `SELECT j.id, j.title, j.location, j.requirements, j.created_at as createdAt, u.company as company
         FROM jobs j JOIN users u ON u.id = j.recruiter_id
         WHERE j.is_active = 1
         ORDER BY j.created_at DESC`
      )
      .all();
    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        location: r.location,
        requirements: (r.requirements || '').split('\n').filter(Boolean),
        createdAt: r.createdAt,
        recruiter: { company: r.company },
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const row = db
      .prepare(
        `SELECT j.*, u.company as recruiterCompany FROM jobs j JOIN users u ON u.id = j.recruiter_id WHERE j.id = ?`
      )
      .get(req.params.id);
    if (!row) return res.status(404).json({ error: { message: 'Job not found', code: 'NOT_FOUND' } });
    res.json({
      job: {
        id: row.id,
        title: row.title,
        team: row.team,
        location: row.location,
        summary: row.summary,
        requirements: (row.requirements || '').split('\n').filter(Boolean),
        niceToHaves: row.nice_to_haves,
      },
      recruiter: { company: row.recruiterCompany },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', authRequired('recruiter'), async (req, res, next) => {
  try {
    const { title, team, location, summary, requirements, niceToHaves } = req.body;
    if (!title || !Array.isArray(requirements)) {
      return res.status(400).json({ error: { message: 'title and requirements[] are required', code: 'VALIDATION' } });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const apiKey = decrypt(user.aicoo_api_key);

    await accumulateContext(apiKey, [
      {
        path: `Recruiters/${user.id}/Jobs/${title}.md`,
        content: formatJobPosting({ title, team, location, summary, requirements, niceToHaves }),
      },
    ]);

    const id = uuid();
    db.prepare(
      `INSERT INTO jobs (id, recruiter_id, title, team, location, summary, requirements, nice_to_haves)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, user.id, title, team || null, location || null, summary || null, requirements.join('\n'), niceToHaves || null);

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
});

router.get('/mine/list', authRequired('recruiter'), (req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
