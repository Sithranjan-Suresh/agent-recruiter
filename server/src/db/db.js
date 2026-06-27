import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || './data/agentrecruit.sqlite';

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

const applicationColumns = db.prepare("PRAGMA table_info(applications)").all().map((c) => c.name);
if (!applicationColumns.includes('revoked')) {
  db.exec('ALTER TABLE applications ADD COLUMN revoked INTEGER NOT NULL DEFAULT 0');
}

const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!userColumns.includes('years_exp')) {
  db.exec('ALTER TABLE users ADD COLUMN years_exp INTEGER');
}
if (!userColumns.includes('skills')) {
  db.exec('ALTER TABLE users ADD COLUMN skills TEXT');
}
