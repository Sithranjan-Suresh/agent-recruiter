# AgentRecruit

Every job candidate gets a persistent AI agent that handles recruiter introductions, answers questions from their real profile context, and routes hiring decisions back to them — powered by [Aicoo](https://www.aicoo.io)'s coordination API.

## What it does

- **Candidates** create a profile once. It's accumulated into an Aicoo workspace as structured markdown (`Profile/overview.md`, `Profile/experience/{company}.md`).
- **Recruiters** post jobs. Candidates apply with one click ("Apply via Agent"), which creates a 7-day Aicoo share link and notifies the recruiter.
- **Recruiters** chat with the candidate's agent — answers stream live from the candidate's actual accumulated context, not generic LLM knowledge.
- **Recruiters** record a decision (Move to Interview / Hold / Not Moving Forward), which is accumulated back into the candidate's workspace and reflected on their dashboard.

Every Aicoo call (`/init`, `/accumulate`, `/share/create`, `/chat`) is real — none of it is mocked.

## Architecture

- `server/` — Node.js/Express API, SQLite (via `better-sqlite3`), JWT auth. All Aicoo calls are centralized in `src/services/aicooService.js`.
- `client/` — React (Vite) + Tailwind CSS + React Router + React Query.
- One shared Aicoo API key is used for all app users; the app simulates per-user workspaces via folder namespacing (`Candidates/{id}/...`, `Recruiters/{id}/...`) — see `engineering_spec.md` for why.

## Aicoo endpoints used

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/init` | Idempotent workspace init on signup/seed |
| `POST /api/v1/accumulate` | Write candidate profile, job postings, recruiter company context, and decision records |
| `POST /api/v1/share/create` | Create the 7-day agent share link when a candidate applies |
| `POST /api/v1/chat` | Streamed recruiter ↔ candidate-agent conversation |

Note: `send_message_to_human` (the `messaging` tool namespace) is **not** used for cross-user notification in this build — since all simulated users share one real Aicoo account, there's no second real Aicoo identity to address a message to. The "recruiter notified" step is an in-app DB event instead. All other calls above are real, per-request, live API calls.

## Running locally

### Backend
```bash
cd server
npm install
cp .env.example .env   # fill in AICOO_API_KEY, JWT_SECRET, ENCRYPTION_KEY
npm run seed           # creates demo accounts + sample jobs/application
npm run dev            # http://localhost:4000
```

### Frontend
```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm run dev            # http://localhost:5173
```

### Demo accounts
- `candidate@demo.com` / `demo123` — Sarah Chen, ML Engineer, profile complete
- `recruiter@demo.com` / `demo123` — Stripe recruiting team, 2 jobs posted, 1 active application

## Deployment

- Backend: Railway/Render (Node service, SQLite on disk, set `AICOO_API_KEY`, `JWT_SECRET`, `ENCRYPTION_KEY`, `DB_PATH`)
- Frontend: Vercel/Netlify (set `VITE_API_URL` to the deployed backend URL)
- Run `npm run seed` against the deployed backend once, so demo accounts exist on the live URL.
