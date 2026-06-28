import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from './db/db.js';
import { seedDemoData } from '../seed/seed.js';
import authRoutes from './routes/authRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/recruiter', recruiterRoutes);

app.use(errorMiddleware);

const port = process.env.PORT || 4000;

async function start() {
  // Render's free tier has no persistent disk, so the SQLite file resets on every
  // deploy/restart. Self-heal back to a working demo state on a fresh, empty DB
  // instead of requiring a manual `npm run seed` after every cold start.
  const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count === 0) {
    try {
      await seedDemoData();
    } catch (err) {
      console.error('Auto-seed failed:', err);
    }
  }

  app.listen(port, () => console.log(`AgentRecruit API listening on :${port}`));
}

start();
