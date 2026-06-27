# AgentRecruit — Engineering Specification
*Implementation design. No code. Design only.*

---

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React SPA)                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Candidate   │    │   Job Board  │    │    Recruiter     │  │
│  │  Dashboard   │    │   (shared)   │    │    Dashboard     │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
└─────────┼──────────────────┼─────────────────────┼─────────────┘
          │                  │                      │
          └──────────────────┼──────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────┐
│                    BACKEND (Node.js / Express)                   │
│                                                                  │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────────────┐  │
│  │  Auth       │  │  Application   │  │  Aicoo Orchestrator  │  │
│  │  Service    │  │  Service       │  │  Service             │  │
│  └─────────────┘  └────────────────┘  └──────────┬───────────┘  │
│                                                   │              │
│  ┌─────────────────────────────────────────────┐ │              │
│  │              SQLite / PostgreSQL DB          │ │              │
│  │  users | jobs | applications | share_links  │ │              │
│  └─────────────────────────────────────────────┘ │              │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │ HTTPS
┌──────────────────────────────────────────────────▼──────────────┐
│                        AICOO API                                 │
│  /init  /accumulate  /share/create  /share/{id}  /tools  /chat  │
│                                                                  │
│  [Candidate Workspace]          [Recruiter Workspace]            │
│   API key: stored server-side    API key: stored server-side     │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural decision:** Each user's Aicoo API key is provisioned at signup and stored encrypted in the DB. The backend always calls Aicoo *on behalf of* the user using their key. The frontend never touches Aicoo directly.

---

## Database Schema

### `users`
```
id             UUID, PK
email          VARCHAR, UNIQUE, NOT NULL
password_hash  VARCHAR, NOT NULL
role           ENUM('candidate', 'recruiter'), NOT NULL
name           VARCHAR, NOT NULL
company        VARCHAR, NULL (recruiter only)
aicoo_api_key  VARCHAR, NOT NULL (encrypted at rest)
aicoo_initialized BOOLEAN, DEFAULT false
created_at     TIMESTAMP, DEFAULT NOW()
```

### `jobs`
```
id             UUID, PK
recruiter_id   UUID, FK → users.id
title          VARCHAR, NOT NULL
team           VARCHAR
location       VARCHAR
summary        TEXT
requirements   TEXT (stored as newline-separated bullets)
nice_to_haves  TEXT
is_active      BOOLEAN, DEFAULT true
created_at     TIMESTAMP, DEFAULT NOW()
```

### `applications`
```
id             UUID, PK
candidate_id   UUID, FK → users.id
job_id         UUID, FK → jobs.id
status         ENUM('agent_intro_sent', 'recruiter_engaged', 'interview', 'offer', 'declined', 'hold')
share_link_id  VARCHAR (Aicoo link ID)
share_link_url VARCHAR (full share URL)
agent_url      VARCHAR (agentUrl from Aicoo response)
created_at     TIMESTAMP, DEFAULT NOW()
decided_at     TIMESTAMP, NULL
UNIQUE (candidate_id, job_id)
```

### `agent_events`
```
id             UUID, PK
application_id UUID, FK → applications.id
event_type     ENUM('intro_sent', 'recruiter_opened', 'question_asked', 'decision_made')
event_summary  VARCHAR (anonymized — e.g. "Question about ML experience")
created_at     TIMESTAMP, DEFAULT NOW()
```

---

## API Design (Backend)

Base URL: `/api`
Auth: JWT in Authorization header (`Bearer {token}`)

### Auth Routes

```
POST /api/auth/signup
  Body: { email, password, role, name, company? }
  Action: Creates user, provisions Aicoo API key via /init, stores key encrypted
  Returns: { token, user: { id, role, name } }

POST /api/auth/login
  Body: { email, password }
  Returns: { token, user: { id, role, name } }
```

### Candidate Routes

```
POST /api/candidate/profile
  Auth: candidate JWT
  Body: { targetRole, yearsExp, skills[], workHistory[{ company, title, dates, summary }], goals, portfolioUrl? }
  Action:
    1. Calls Aicoo /accumulate with Profile/overview.md (structured markdown of all profile fields)
    2. Calls /accumulate for each work history entry as Profile/experience/{company}.md
    3. Sets users.aicoo_initialized = true
  Returns: { success: true }

GET /api/candidate/applications
  Auth: candidate JWT
  Returns: [{ id, job: { title, company }, status, createdAt, recentEvents[] }]
```

### Job Routes

```
GET /api/jobs
  Public
  Returns: [{ id, recruiter: { company }, title, location, requirements[], createdAt }]

POST /api/jobs
  Auth: recruiter JWT
  Body: { title, team, location, summary, requirements[], niceToHaves }
  Action: Accumulates job to recruiter's Aicoo workspace at Jobs/{title}.md
  Returns: { job }

GET /api/jobs/:id
  Public
  Returns: { job, recruiter: { company } }
```

### Application Routes

```
POST /api/applications
  Auth: candidate JWT
  Body: { jobId }
  Action:
    1. Check no duplicate (candidate_id + job_id)
    2. Call candidate's Aicoo /share/create:
       { scope: "all", access: "read", label: "{name} → {title} at {company}", expiresIn: "7d" }
    3. Store share link data in applications table
    4. Call recruiter's Aicoo tools endpoint: send_message_to_human
       { to: recruiter's Aicoo user identity, message: "Agent intro from {name}..." }
    5. Create agent_event: intro_sent
  Returns: { application }

POST /api/applications/:id/decision
  Auth: recruiter JWT
  Body: { decision: 'interview' | 'hold' | 'declined' }
  Action:
    1. Validate recruiter owns this job
    2. Update application status in DB
    3. Call candidate's Aicoo /accumulate:
       { files: [{ path: "Applications/{job_title}_decision.md", content: "..." }] }
    4. Create agent_event: decision_made
  Returns: { success: true }
```

### Recruiter Routes

```
GET /api/recruiter/inbox
  Auth: recruiter JWT
  Returns: [{ applicationId, candidate: { name }, job: { title }, status, agentUrl, createdAt }]

GET /api/recruiter/applications/:id/chat-token
  Auth: recruiter JWT
  Action: Returns the agentUrl for this application (stored at apply time)
  Returns: { agentUrl }

POST /api/recruiter/applications/:id/chat
  Auth: recruiter JWT
  Body: { message, conversationId? }
  Action: Proxies to candidate's Aicoo /chat using candidate's API key + share token context
  Note: This is the key proxy — backend uses candidate's stored key to call /chat on their behalf
  Returns: streamed Aicoo response
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthGuard (checks JWT, redirects)
├── Routes
│   ├── /login → LoginPage
│   ├── /signup → SignupPage (role selector → candidate or recruiter form)
│   ├── /jobs → JobBoard (public)
│   │   └── JobCard (list item)
│   │       └── ApplyButton (disabled if no profile)
│   ├── /candidate
│   │   ├── /profile → CandidateProfileForm
│   │   └── /dashboard → CandidateDashboard
│   │       ├── ApplicationList
│   │       │   └── ApplicationCard (status badge, activity count)
│   │       └── AgentStatusBanner ("Your agent is active on 3 roles")
│   └── /recruiter
│       ├── /jobs/new → JobPostForm
│       ├── /inbox → RecruiterInbox
│       │   └── AgentIntroCard (candidate name, role, status dot, timestamp)
│       └── /applications/:id → ApplicationDetail
│           ├── AgentChatPanel (left, ~60% width)
│           │   ├── MessageList (streamed, scrollable)
│           │   └── MessageInput + Send
│           └── DecisionPanel (right, ~40% width)
│               ├── CandidateSummary (name, role, applied date)
│               └── DecisionButtons (Move to Interview | Hold | Decline)
```

### Routing
- React Router v6
- Private routes wrapped in `<AuthGuard role="candidate">` or `<AuthGuard role="recruiter">`
- Redirect unauthorized users to /login with `?redirect=` param

### State Management
- React Query for all server state (applications, jobs, inbox)
- Local useState for form state
- No Redux — scope doesn't warrant it
- Chat messages: local state in AgentChatPanel, appended on stream events

### Key Frontend Behaviors

**Streaming chat:** Backend proxies Aicoo's streamed response. Frontend reads SSE or chunked transfer, appends text deltas to local message array as they arrive. Show a typing indicator (pulsing dots) while streaming.

**Status polling:** Candidate dashboard polls `/api/candidate/applications` every 30 seconds to catch recruiter decisions. Alternatively use a simple SSE endpoint on the backend.

**Share link application flow:**
1. Candidate clicks "Apply via Agent"
2. Button shows spinner: "Setting up your agent..."
3. On success: button becomes disabled, shows "Agent active"
4. Toast: "Your agent introduced itself to the recruiter"

---

## Backend Architecture

### Service Structure

```
/src
  /routes          → Express route handlers (thin, no logic)
  /services
    authService.js      → signup, login, JWT
    aicooService.js     → all Aicoo API calls (single wrapper file)
    applicationService.js → apply, decide, status updates
    jobService.js       → CRUD for jobs
  /middleware
    authMiddleware.js   → JWT verify, attach req.user
    errorMiddleware.js  → standard error shape
  /db
    schema.sql          → table definitions
    db.js               → connection pool
  /utils
    encrypt.js          → AES encrypt/decrypt for API keys
    markdown.js         → profile → structured markdown formatter
```

### aicooService.js (all Aicoo calls centralized here)

Functions:
- `initWorkspace(apiKey)` → POST /api/v1/init
- `accumulateContext(apiKey, files)` → POST /api/v1/accumulate
- `createShareLink(apiKey, options)` → POST /api/v1/share/create
- `revokeShareLink(apiKey, linkId)` → DELETE /api/v1/share/{linkId}
- `sendMessageToUser(apiKey, recipientIdentity, message)` → POST /api/v1/tools with tool: send_message_to_human
- `chatWithAgent(apiKey, message, conversationId?)` → POST /api/v1/chat (streaming)

All functions accept the user's decrypted API key as first param. Never store decrypted keys in memory longer than the request lifecycle.

### Profile → Markdown Formatter

Candidate profile fields are formatted as structured markdown before being accumulated to Aicoo. This is the most important quality lever — well-structured context = better agent answers.

Format for `Profile/overview.md`:
```markdown
# {Name} — Recruiting Profile

## Target Role
{targetRole}

## Summary
{goals}

## Experience
{yearsExp} years of experience

## Core Skills
{skills joined by ", "}

## Portfolio
{portfolioUrl if provided}
```

Format for `Profile/experience/{company}.md`:
```markdown
# {company} — {title}
{dates}

{summary}
```

---

## External Integrations

| Integration | How Used | Endpoints |
|---|---|---|
| Aicoo API | Core coordination layer — all agent operations | /init, /accumulate, /share/create, /share/{id}, /tools, /chat |
| No other external APIs | Intentionally lean — keep Aicoo as the clear star | — |

**Note on Aicoo API key provisioning:** In a real product, each user would create their own Aicoo account and provide their API key. For the hackathon demo, use a simpler approach: your app has a primary Aicoo API key, and you simulate per-user workspaces by using folder namespacing (e.g., `Candidates/{candidateId}/Profile/overview.md`). This is a valid shortcut for demo purposes and still uses all the same API endpoints.

---

## State Management — Full Application Flow

```
[Candidate signs up]
  → users table created
  → Aicoo /init called
  → aicoo_initialized = false

[Candidate submits profile]
  → /accumulate called with profile files
  → aicoo_initialized = true

[Candidate clicks Apply]
  → applications row created (status: pending)
  → /share/create called → share_link_id, agent_url stored
  → send_message_to_human called on recruiter's key
  → application status → agent_intro_sent
  → agent_event: intro_sent

[Recruiter opens inbox]
  → GET /recruiter/inbox → list of agent_intro_sent applications

[Recruiter opens chat]
  → GET /recruiter/applications/:id/chat-token → returns agentUrl
  → Application status → recruiter_engaged
  → agent_event: recruiter_opened

[Recruiter sends message]
  → POST /recruiter/applications/:id/chat
  → Backend proxies to candidate's Aicoo /chat (using candidate API key)
  → agent_event: question_asked (topic only, anonymized)
  → Response streamed back to frontend

[Recruiter makes decision]
  → POST /applications/:id/decision
  → DB status updated
  → Candidate's Aicoo /accumulate called with decision file
  → agent_event: decision_made
  → Candidate dashboard reflects new status on next poll
```

---

## Deployment Strategy

**What "submitted and running" looks like:**

1. **Backend:** Deploy to Railway or Render (free tier, no config needed)
   - Single Node.js service
   - SQLite DB on disk (acceptable for hackathon — no setup time)
   - Environment variables: `AICOO_API_KEY`, `JWT_SECRET`, `ENCRYPTION_KEY`

2. **Frontend:** Deploy to Vercel or Netlify (free, instant deploys from GitHub)
   - React build output
   - Single env var: `VITE_API_URL` pointing to Railway backend

3. **GitHub repo:** Single monorepo with `/client` and `/server` directories

4. **Demo data:** Seed script that creates 2 pre-loaded candidate profiles and 2 job postings so demo starts with content already in place — never start a demo from an empty state

5. **Demo accounts:** Pre-create accounts:
   - `candidate@demo.com` / `demo123` — Sarah Chen, ML Engineer, profile complete
   - `recruiter@demo.com` / `demo123` — Stripe Engineering recruiting team

**Submission checklist:**
- [ ] Live URL works on a fresh browser (not localhost)
- [ ] Demo accounts functional
- [ ] All Aicoo API calls are real (not mocked)
- [ ] GitHub repo public with README
- [ ] README includes: what it does, how to run it, which Aicoo endpoints are used
