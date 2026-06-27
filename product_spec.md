# AgentRecruit — Product Specification
*Complete product requirements for engineering team*

---

## Product Requirements (must be true at submission)

1. A candidate can sign up, fill a profile, and have their context stored in an Aicoo workspace
2. A recruiter can sign up and post a job with role requirements
3. A candidate can apply to a job, triggering an Aicoo share link creation and recruiter notification
4. A recruiter can open the agent intro, enter a chat interface, and ask the candidate's agent questions
5. The agent answers from candidate context — not from generic LLM knowledge
6. A recruiter can make a hiring decision that routes back to the candidate's workspace
7. A candidate can see application status and agent activity on their dashboard
8. All Aicoo API calls are real (not mocked) and visible to a technical judge

---

## User Stories + Acceptance Criteria

### Candidate Stories

---

**US-C1: Profile Setup**
*As a candidate, I want to create a profile so that my agent has the context it needs to represent me.*

Acceptance Criteria:
- [ ] Form accepts: full name, target role, years of experience, skills (freetext), work history (company + title + dates + summary), goals, portfolio URL (optional)
- [ ] On submit, calls `/api/v1/init` to initialize candidate's Aicoo workspace
- [ ] Calls `/api/v1/accumulate` with structured profile as a file at path `Profile/overview.md`
- [ ] Each work history entry accumulated as a separate file at `Profile/experience/{company}.md`
- [ ] Success state shows: "Your agent is ready" with a visual confirmation
- [ ] Error state: shows which fields are missing, does not silently fail

---

**US-C2: Browse Jobs**
*As a candidate, I want to browse open job postings so that I can find roles to apply to.*

Acceptance Criteria:
- [ ] Job board lists all active postings with: company name, role title, location, key requirements (3 bullets max)
- [ ] Each listing shows an "Apply via Agent" button
- [ ] Button is disabled if candidate has not completed profile setup
- [ ] Disabled button shows tooltip: "Complete your profile first"

---

**US-C3: Apply via Agent**
*As a candidate, I want to apply to a job with my agent so that the recruiter gets context instead of a resume.*

Acceptance Criteria:
- [ ] Clicking "Apply via Agent" triggers backend call to `/api/v1/share/create` with scope: all, access: read, label: `"{candidate_name} → {job_title} at {company}"`, expiresIn: 7d
- [ ] Share link stored in DB with: candidateId, jobId, linkId, linkUrl, agentUrl, createdAt, status
- [ ] Backend calls `send_message_to_human` tool via `/api/v1/tools` on recruiter's Aicoo account, sending: agent intro message with candidate name, role match, and agentUrl
- [ ] Application record created in DB with status: `agent_intro_sent`
- [ ] Candidate dashboard updates to show application with status: "Agent intro sent"
- [ ] Duplicate application to same job is blocked with message: "Your agent is already active for this role"

---

**US-C4: Candidate Dashboard**
*As a candidate, I want to see my application status and agent activity so that I know what's happening.*

Acceptance Criteria:
- [ ] Dashboard shows list of applications with: company, role, date applied, current status
- [ ] Statuses: `Agent intro sent` → `Recruiter engaged` → `Interview scheduled` → `Offer` / `Not moving forward`
- [ ] Each application has an activity log showing recruiter questions (anonymized topic, not full text) and agent responses (count + timestamp)
- [ ] Status updates from recruiter decisions are reflected within 60 seconds (polling or websocket)
- [ ] Empty state: "You haven't applied to any roles yet. Browse jobs →"

---

### Recruiter Stories

---

**US-R1: Recruiter Onboarding**
*As a recruiter, I want to set up my recruiting workspace so that context about my company and roles is available.*

Acceptance Criteria:
- [ ] Recruiter form accepts: name, company, title, team description
- [ ] Calls `/api/v1/init` to initialize recruiter's Aicoo workspace
- [ ] Company context accumulated at `Company/overview.md`
- [ ] On completion, recruiter is taken to their dashboard

---

**US-R2: Post a Job**
*As a recruiter, I want to post a job listing so that candidates can apply.*

Acceptance Criteria:
- [ ] Job form accepts: title, team, location, role summary, 3–5 key requirements, nice-to-haves
- [ ] Job requirements accumulated into recruiter's Aicoo workspace at `Jobs/{job_title}.md`
- [ ] Job is published to candidate-facing job board immediately
- [ ] Recruiter can see their posted jobs in a "My Roles" tab

---

**US-R3: Recruiter Inbox**
*As a recruiter, I want to see agent intro messages from candidates so that I can decide who to engage.*

Acceptance Criteria:
- [ ] Inbox lists all incoming agent intros with: candidate name, target role, date received, status (New / Viewed / Decided)
- [ ] Each row shows 1-line summary pulled from candidate's Aicoo workspace context (via candidate's share link)
- [ ] Clicking a row opens the agent chat view
- [ ] New intros shown with a visual indicator (dot, bold)
- [ ] Empty state: "No agent introductions yet. Active job postings attract candidates."

---

**US-R4: Agent Chat**
*As a recruiter, I want to chat with a candidate's agent so that I can screen them asynchronously without a call.*

Acceptance Criteria:
- [ ] Chat interface loads the candidate's agent via their Aicoo share link (using the `agentUrl` stored at application time)
- [ ] Recruiter can type freeform questions
- [ ] Agent responds from candidate's Aicoo context (via Aicoo's chat endpoint behind the share token)
- [ ] Conversation is streamed (not batch) — responses appear word by word
- [ ] Conversation history is visible and scrollable
- [ ] Agent does not hallucinate info not in the candidate's context — if asked something unknown, responds: "I don't have that detail from Sarah's profile. You may want to ask her directly."
- [ ] Chat session persists: if recruiter returns, prior conversation is still visible

---

**US-R5: Make a Decision**
*As a recruiter, I want to record a hiring decision so that the candidate is notified and my pipeline is updated.*

Acceptance Criteria:
- [ ] Decision panel shows three options: "Move to Interview", "Hold", "Not Moving Forward"
- [ ] Each option requires a single click to confirm (no extra modal, just a confirm button inline)
- [ ] On decision, backend calls candidate's Aicoo `/api/v1/accumulate` with decision file at `Applications/{job_title}_decision.md` containing: decision, timestamp, recruiter company
- [ ] Application status updated in DB for both recruiter pipeline view and candidate dashboard
- [ ] Recruiter sees confirmation: "Decision recorded. Sarah Chen notified."
- [ ] Decision cannot be changed after recording (this is intentional — keeps data clean for demo)

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Candidate applies before completing profile | "Apply via Agent" button disabled with tooltip |
| Share link expires (7 days) | Show "This link has expired" in recruiter chat; candidate dashboard shows "Reactivate agent" option |
| Aicoo API rate limit hit | Show "Agent is busy — try again in a moment" with retry button |
| Recruiter asks question agent can't answer | Agent responds: "I don't have that detail. You may want to ask [candidate] directly." |
| Duplicate application to same job | Block with message, link to existing application |
| Recruiter makes decision before engaging in chat | Allowed — decision panel is always visible in agent chat view |

---

## Feature Priority

| Feature | Priority | Demo-blocking? |
|---|---|---|
| Candidate onboarding + Aicoo workspace setup | P0 | Yes |
| Apply via Agent (share link + recruiter message) | P0 | Yes |
| Recruiter agent chat interface | P0 | Yes |
| Decision routing + candidate notification | P0 | Yes |
| Candidate dashboard with status | P1 | No |
| Recruiter inbox list view | P1 | No |
| Recruiter job posting flow | P1 | No (can hardcode job for demo) |
| Share link management / revocation | P2 | No |
| Heartbeat daily briefing for recruiter | P2 | No |
| Polish: animations, loading states, empty states | P1 | No (but affects score) |
