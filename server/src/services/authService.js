import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { db } from '../db/db.js';
import { encrypt } from '../utils/encrypt.js';
import { initWorkspace } from './aicooService.js';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export async function signup({ email, password, role, name, company }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.status = 409;
    throw err;
  }

  const apiKey = process.env.AICOO_API_KEY;
  await initWorkspace(apiKey).catch((err) => {
    err.message = `Aicoo init failed: ${err.message}`;
    throw err;
  });

  const id = uuid();
  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, role, name, company, aicoo_api_key, aicoo_initialized)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
  ).run(id, email, passwordHash, role, name, company || null, encrypt(apiKey));

  const user = { id, role, name };
  return { token: signToken(user), user };
}

export async function login({ email, password }) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const user = { id: row.id, role: row.role, name: row.name };
  return { token: signToken(user), user };
}
