# AgentRecruit — Implementation Task List
*Sequenced, dependency-ordered build checklist. Complete every task = production-ready submission.*

---

## Database

1. **Write `schema.sql`** with tables: `users`, `jobs`, `applications`, `agent_events` exactly per engineering spec (fields, enums, FKs, unique constraint on `applications(candidate_id, job_id)`).
2. **Set up DB connection** (`/db/db.js`) using SQLite (file-based, zero-config for demo) with a connection helper/pool used by all services.
3. **Run schema migration locally** and verify all 4 tables exist with correct columns via a quick `SELECT` smoke test.

## Backend — Core Services & Middleware

4. **Build `encrypt.js`** — AES encrypt/decrypt helpers for `aicoo_api_key` at rest (used in signup + every Aicoo call).
5. **Build `aicooService.js`** — single wrapper file with functions: `initWorkspace`, `accumulateContext`, `createShareLink`, `revokeShareLink`, `sendMessageToUser`, `chatWithAgent`. Use real Aicoo API base URL + the team's primary Aicoo API key. Implement the `Candidates/{candidateId}/...` and `Recruiters/{recruiterId}/...` folder-namespacing shortcut described in the eng spec (single shared key, simulated per-user workspaces).
6. **Build `markdown.js`** — formatter that turns a candidate profile object into `Profile/overview.md` content and each work-history entry into `Profile/experience/{company}.md` content, matching the exact templates in the eng spec.
7. **Build `authMiddleware.js`** — JWT verify, attaches `req.user = { id, role }`.
8. **Build `errorMiddleware.js`** — standard `{ error: { message, code } }` shape, catches thrown errors from routes/services.

## Backend — Auth

9. **Build `authService.js` + `POST /api/auth/signup`** — creates user row, calls `aicooService.initWorkspace`, stores encrypted key, sets `aicoo_initialized=false`, returns `{ token, user }`. *(Depends on: 1, 4, 5, 7)*
10. **Build `POST /api/auth/login`** — validates credentials, returns `{ token, user }`. *(Depends on: 9)*

## Backend — Candidate

11. **Build `POST /api/candidate/profile`** — accepts profile body, calls `markdown.js` formatter, calls `accumulateContext` for `Profile/overview.md` and each `Profile/experience/{company}.md`, sets `aicoo_initialized=true`. *(Depends on: 5, 6, 9)*
12. **Build `GET /api/candidate/applications`** — returns candidate's applications joined with job + recent `agent_events`. *(Depends on: 1, 9)*

## Backend — Jobs

13. **Build `GET /api/jobs`** (public) — list active jobs with recruiter company, title, location, requirements. *(Depends on: 1)*
14. **Build `POST /api/jobs`** — recruiter creates job row, accumulates `Jobs/{title}.md` to recruiter's Aicoo workspace. *(Depends on: 5, 9)*
15. **Build `GET /api/jobs/:id`** (public) — single job + recruiter company. *(Depends on: 13)*

## Backend — Applications (P0 critical path)

16. **Build `applicationService.js` — apply flow** for `POST /api/applications`: check no duplicate (candidate_id+job_id), call `createShareLink` (scope: all, access: read, label, expiresIn: 7d), store share link fields on the application row, call `sendMessageToUser` on recruiter's workspace with intro message, insert `agent_event: intro_sent`. *(Depends on: 1, 5, 9, 13)*
17. **Build `POST /api/applications/:id/decision`** — validate recruiter owns the job, update status, call `accumulateContext` with `Applications/{job_title}_decision.md`, insert `agent_event: decision_made`. *(Depends on: 16)*

## Backend — Recruiter

18. **Build `GET /api/recruiter/inbox`** — list applications for recruiter's jobs with candidate name, job title, status, agentUrl. *(Depends on: 16)*
19. **Build `GET /api/recruiter/applications/:id/chat-token`** — returns stored `agentUrl`; on first open, update status to `recruiter_engaged` and insert `agent_event: recruiter_opened`. *(Depends on: 16)*
20. **Build `POST /api/recruiter/applications/:id/chat`** — proxy to candidate's Aicoo `/chat` using candidate's decrypted key + share-scoped context; stream response back; insert `agent_event: question_asked` with anonymized topic only. *(Depends on: 5, 19)*

## Backend — Demo Data

21. **Write seed script** — creates the 2 demo accounts (`candidate@demo.com`, `recruiter@demo.com`), 2 pre-loaded job postings, and runs the candidate profile + 1 completed Aicoo accumulate so the demo never starts empty. *(Depends on: 9, 11, 14)*

## Frontend — Scaffolding

22. **Scaffold React app** (Vite) with React Router v6 and React Query provider set up at the root.
23. **Build `AuthGuard`** component — checks JWT, redirects to `/login?redirect=` if missing/invalid role. *(Depends on: 22)*
24. **Build `LoginPage` + `SignupPage`** (role selector → candidate/recruiter form) wired to `/api/auth/login` and `/api/auth/signup`. *(Depends on: 9, 10, 22)*

## Frontend — Candidate Flow (P0)

25. **Build `CandidateProfileForm`** — fields per US-C1 (name, target role, years exp, skills, work history repeatable rows, goals, portfolio URL); on submit calls `POST /api/candidate/profile`; shows "Your agent is ready" success state and field-level error state. *(Depends on: 11, 24)*
26. **Build `JobBoard` + `JobCard` + `ApplyButton`** — public list from `GET /api/jobs`; Apply button disabled with tooltip if profile incomplete. *(Depends on: 13, 22)*
27. **Wire `ApplyButton` apply flow** — spinner "Setting up your agent...", calls `POST /api/applications`, on success disables button to "Agent active" and shows toast "Your agent introduced itself to the recruiter"; on duplicate, shows block message with link to existing application. *(Depends on: 16, 26)*
28. **Build `CandidateDashboard`** — `ApplicationList`/`ApplicationCard` (status badge, activity count) + `AgentStatusBanner`; empty state copy; poll `GET /api/candidate/applications` every 30s. *(Depends on: 12, 27)*

## Frontend — Recruiter Flow (P0)

29. **Build `JobPostForm`** — fields per US-R2, submits to `POST /api/jobs`, redirects to "My Roles". *(Depends on: 14, 24)*
30. **Build `RecruiterInbox` + `AgentIntroCard`** — list from `GET /api/recruiter/inbox`, status dot for New, empty state copy. *(Depends on: 18, 24)*
31. **Build `ApplicationDetail` layout** — `AgentChatPanel` (60% width) + `DecisionPanel` (40% width) with `CandidateSummary`. *(Depends on: 30)*
32. **Wire `AgentChatPanel` streaming chat** — calls `GET /chat-token` on open, `MessageInput`/`MessageList`, reads streamed response from `POST /chat` and appends text deltas live with a pulsing typing indicator; persists history on revisit. *(Depends on: 19, 20, 31)*
33. **Wire `DecisionPanel`** — three buttons (Move to Interview / Hold / Decline), single-click confirm, calls `POST /applications/:id/decision`, shows "Decision recorded. {Name} notified.", disables after decision is made. *(Depends on: 17, 31)*

## Integration / Demo-Critical Path Verification (P0)

34. **End-to-end smoke test of the full demo flow** using seeded demo accounts: candidate profile → apply → recruiter inbox → agent chat answers from real context → decision → candidate dashboard reflects update. Confirm every Aicoo call (`/init`, `/accumulate`, `/share/create`, `/tools`, `/chat`) is real, not mocked, and visible in network tab/logs.
35. **Verify "agent doesn't hallucinate" behavior** — ask the chat a question with no answer in candidate context, confirm it responds with the fallback line from US-R4 instead of inventing an answer.

---

## P1 — Polish & Secondary Features

36. **Recruiter workspace context accumulation** — confirm `Company/overview.md` accumulated at `POST /api/recruiter/onboarding` (US-R1), if not already covered by signup.
37. **Activity log detail on candidate dashboard** — show anonymized question topics + agent response counts/timestamps per application (US-C4).
38. **Loading states** — skeleton/spinner states for job board, inbox, dashboard, and chat panel while data fetches.
39. **Empty states** — confirm exact copy from specs is implemented for: no applications, no inbox intros.
40. **Error handling polish** — Aicoo rate-limit case ("Agent is busy — try again in a moment" + retry button) and share-link-expired case ("This link has expired" / "Reactivate agent").
41. **Visual polish pass** — Tailwind styling consistency, transitions on toasts/buttons, status badge colors per status value.

## P2 — Stretch (only if time remains after all P0/P1)

42. **Share link management UI** — list/revoke active candidate share links, wired to `revokeShareLink`.
43. **Recruiter daily briefing endpoint** — `/briefing` heartbeat summary surfaced in recruiter UI.

---

## Deployment

44. **Backend deploy to Railway/Render** — single Node service, SQLite on disk, env vars `AICOO_API_KEY`, `JWT_SECRET`, `ENCRYPTION_KEY` set.
45. **Frontend deploy to Vercel/Netlify** — `VITE_API_URL` pointed at deployed backend.
46. **Run seed script against deployed backend** so demo accounts exist on the live URL, not just locally.
47. **Fresh-browser run-through on the live URL** (not localhost) of the full demo flow from task 34.
48. **Write README** — what it does, how to run it, which Aicoo endpoints are used; push public GitHub monorepo (`/client`, `/server`).
