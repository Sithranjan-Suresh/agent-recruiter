import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { applyToJob, recordDecision } from '../services/applicationService.js';

const router = Router();

router.post('/', authRequired('candidate'), async (req, res, next) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: { message: 'jobId is required', code: 'VALIDATION' } });
    const application = await applyToJob(req.user.id, jobId);
    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/decision', authRequired('recruiter'), async (req, res, next) => {
  try {
    const { decision } = req.body;
    const application = await recordDecision(req.user.id, req.params.id, decision);
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
});

export default router;
