import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);

app.use(errorMiddleware);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`AgentRecruit API listening on :${port}`));
