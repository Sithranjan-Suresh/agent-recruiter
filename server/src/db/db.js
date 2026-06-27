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
if (!userColumns.includes('target_role')) {
  db.exec('ALTER TABLE users ADD COLUMN target_role TEXT');
}
if (!userColumns.includes('goals')) {
  db.exec('ALTER TABLE users ADD COLUMN goals TEXT');
}
if (!userColumns.includes('portfolio_url')) {
  db.exec('ALTER TABLE users ADD COLUMN portfolio_url TEXT');
}
if (!userColumns.includes('work_history')) {
  db.exec('ALTER TABLE users ADD COLUMN work_history TEXT');
}

const agentEventsSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'agent_events'").get();
if (agentEventsSql && !agentEventsSql.sql.includes('decision_debrief')) {
  db.exec(`
    ALTER TABLE agent_events RENAME TO agent_events_old;
    CREATE TABLE agent_events (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id),
      event_type TEXT NOT NULL CHECK (event_type IN ('intro_sent', 'recruiter_opened', 'question_asked', 'decision_made', 'decision_debrief')),
      event_summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO agent_events SELECT * FROM agent_events_old;
    DROP TABLE agent_events_old;
  `);
}
