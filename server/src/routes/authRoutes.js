import { Router } from 'express';
import { signup, login } from '../services/authService.js';

const router = Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, role, name, company } = req.body;
    if (!email || !password || !role || !name) {
      return res.status(400).json({ error: { message: 'email, password, role, and name are required', code: 'VALIDATION' } });
    }
    const result = await signup({ email, password, role, name, company });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
