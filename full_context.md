# AgentRecruit — Full Project Context
*For any engineer joining the project with zero prior context*

---

## Vision

**One sentence:** AgentRecruit gives every job candidate a persistent AI agent that handles recruiter introductions, answers questions, and routes decisions — powered by Aicoo's coordination infrastructure.

**One paragraph:** Recruiting coordination is broken at both ends. Candidates send hundreds of cold applications into the void. Recruiters receive hundreds of decontextualized PDFs with no way to efficiently engage. AgentRecruit reframes this by giving each candidate an Aicoo-powered agent that holds their professional context, introduces itself to recruiter agents via permissioned share links, answers recruiter questions from that context, and routes decisions back to the candidate — all without either party having to repeat themselves or lose information across touchpoints.

---

## Problem

- The average corporate job posting receives 250 applications. Recruiters spend ~6 seconds on each resume.
- Candidates have no visibility into where they stand after applying.
- Every recruiter-candidate interaction starts from zero: no persistent context, no memory of prior touchpoints.
- The coordination cost of recruiting — emails, phone screens, status updates — eats 40–60% of recruiter time.
- Existing ATS tools (Greenhouse, Lever) digitize the paper process without rethinking the coordination model.

**The root cause:** there is no shared coordination layer between candidates and recruiters. Every interaction is one-off, decontextualized, and manual.

---

## Target Users

**Candidates**
- Mid-to-senior tech professionals actively job seeking
- Currently: updating LinkedIn, tailoring 50 versions of a resume, sending cold applications, waiting with no feedback
- Pain: invisible to recruiters, no context persistence, constant re-explanation at each stage

**Recruiters**
- In-house technical recruiters at mid-to-large tech companies
- Currently: triaging hundreds of inbound applications, scheduling screens, manually tracking status
- Pain: no way to engage meaningfully at scale, context lost between touchpoints, screening calls are repetitive

---

## User Journey

### Candidate
1. Signs up → fills out profile (name, role target, work history, skills, goals, portfolio links)
2. Profile is accumulated into their personal Aicoo workspace via `/accumulate`
3. Browses job postings → clicks "Apply via Agent" on a role
4. System creates a scoped Aicoo share link for their workspace → sends to recruiter via `send_message_to_human` tool
5. Candidate dashboard shows: "Application sent — agent active"
6. When recruiter interacts with agent, candidate sees activity log updates
7. When recruiter makes a decision, candidate receives update: "Moved to interview" or "Not moving forward"

### Recruiter
1. Signs up → sets up their own Aicoo workspace (company context, role requirements)
2. Receives agent intro messages in their inbox
3. Clicks a message → opens an agent chat interface loaded with the candidate's context
4. Asks questions — agent responds from candidate's Aicoo workspace context
5. Makes a decision (Move Forward / Hold / Decline) → decision is routed back and accumulated into candidate's workspace
6. Maintains a pipeline view of all active agent conversations

---

## Core Features (at submission)

| Feature | Description | Priority |
|---|---|---|
| Candidate onboarding | Profile form → Aicoo workspace setup via `/init` + `/accumulate` | P0 |
| Job board | Recruiter-created job postings with role context | P0 |
| Apply via Agent | Triggers `/share/create` + `send_message_to_human` tool call | P0 |
| Agent chat (recruiter view) | Recruiter chats with candidate's agent via Aicoo share link interface | P0 |
| Decision routing | Recruiter decision accumulated back to candidate workspace | P0 |
| Candidate dashboard | Application status, agent activity log | P1 |
| Recruiter inbox | List of incoming agent intros, filterable | P1 |
| Recruiter workspace context | Store job requirements in recruiter's Aicoo workspace | P1 |
| Share link management | List/revoke active candidate share links | P2 |
| Heartbeat summary | Daily briefing for recruiter via `/briefing` endpoint | P2 |

---

## Key Differentiators

| vs. Traditional ATS | AgentRecruit |
|---|---|
| Resume PDF as primary artifact | Persistent agent with context |
| Email/phone for screening | Agent-mediated async screening |
| Context restarted at each touchpoint | Context preserved across entire recruiting lifecycle |
| One-way application flow | Bidirectional coordination via Aicoo |

---

## Technical Overview

**Stack:**
- Frontend: React + Tailwind CSS (single-page app, two personas: candidate / recruiter)
- Backend: Node.js / Express (API layer between frontend and Aicoo)
- Database: SQLite or PostgreSQL (lightweight — stores user accounts, job postings, application state, share link mappings)
- AI: Aicoo API (all agent intelligence, context storage, share links, messaging)
- No separate LLM integration needed — Aicoo's `/chat` endpoint handles all agent reasoning

**Architecture approach:**
- Each user (candidate or recruiter) gets their own Aicoo API key stored server-side
- Your backend acts as the orchestration layer: it calls Aicoo on behalf of users, manages share link creation/mapping, and routes decisions
- The agent chat UI in the recruiter view is essentially a wrapper around Aicoo's shared agent URL (either embedded via iframe or replicated via `/chat` API calls using the share token)

**Key technical bets:**
1. Aicoo's `/share/create` + `send_message_to_human` combo is sufficient for cross-user agent coordination
2. `/accumulate` is used as the source of truth for candidate context — no separate vector DB needed
3. Agent quality (recruiter-facing answers) depends on how well candidate context is structured in the Aicoo workspace — this is the main quality lever

---

## Demo Flow (matches Phase 4)

1. Candidate onboards → profile accumulated to Aicoo workspace
2. Candidate applies to a job → share link created, recruiter notified via messaging tool
3. Recruiter opens inbox → sees agent intro message
4. Recruiter opens agent chat → asks a specific technical question
5. Agent answers correctly from candidate's Aicoo context
6. Recruiter clicks "Move to Interview"
7. Decision routed back → candidate sees notification on dashboard

---

## Success Metrics

**Technical:**
- All Aicoo API calls (init, accumulate, share/create, tools/execute, chat) are real and working, not mocked
- Agent answers recruiter questions accurately from candidate context
- Share link creation → recruiter notification → agent chat flow works end-to-end

**Product:**
- A judge can watch the 90-second demo and understand the full value prop without explanation
- Both candidate and recruiter dashboards are polished and navigable
- The "Aicoo is the coordination layer" narrative is visible in the product, not just claimed in the pitch

---

## Future Expansion (for judges to imagine)

1. **Multi-round context persistence** — agent remembers every recruiter interaction across the full pipeline (phone screen → technical → final), so no candidate ever repeats themselves
2. **Recruiter agent** — recruiter also has an Aicoo workspace; agents negotiate scheduling, share job requirement context, and produce structured summaries for hiring managers
3. **Referral routing** — existing employees' agents can introduce candidates from their network directly into recruiter agent inboxes with trusted context
