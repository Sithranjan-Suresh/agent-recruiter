CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter')),
  name TEXT NOT NULL,
  company TEXT,
  aicoo_api_key TEXT NOT NULL,
  aicoo_initialized INTEGER NOT NULL DEFAULT 0,
  years_exp INTEGER,
  skills TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  recruiter_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  team TEXT,
  location TEXT,
  summary TEXT,
  requirements TEXT,
  nice_to_haves TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES users(id),
  job_id TEXT NOT NULL REFERENCES jobs(id),
  status TEXT NOT NULL CHECK (status IN ('agent_intro_sent', 'recruiter_engaged', 'interview', 'offer', 'declined', 'hold')) DEFAULT 'agent_intro_sent',
  share_link_id TEXT,
  share_link_url TEXT,
  agent_url TEXT,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT,
  UNIQUE (candidate_id, job_id)
);

CREATE TABLE IF NOT EXISTS agent_events (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('intro_sent', 'recruiter_opened', 'question_asked', 'decision_made')),
  event_summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
