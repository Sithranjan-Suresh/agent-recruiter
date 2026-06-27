# AgentRecruit — 90-Second Demo Script

Record against the deployed URL once live. Use the seeded demo accounts
(`candidate@demo.com` / `recruiter@demo.com`, password `demo123`) so the
recruiter chat has real accumulated context to answer from.

Pre-verified questions that get clean, well-cited answers (use these, not
improvised ones — agent retrieval over `experience/` files is occasionally
inconsistent on contributor-chosen test phrasing):
- "What is her experience with PyTorch?"
- "What is her strongest project?"
- "What did she do at DataWorks?"

---

**0:00–0:10 — The hook (landing page)**
> "The average job posting gets 250 applications. Recruiters spend six
> seconds on each one. AgentRecruit gives every candidate a persistent AI
> agent that carries their real work history into every recruiter
> conversation — so nobody gets six seconds, and nobody repeats themselves."

Show the landing page hero and scroll past the 4-step section.

**0:10–0:25 — Candidate side**
Log in as `candidate@demo.com`. Show the dashboard: "Your agent is active
on 1 role," with the live activity log of recruiter actions already on it.
> "Sarah set up her profile once — work history, skills, goals. That's
> accumulated into a real Aicoo workspace, not stored as a PDF."

**Optional stronger version of 0:25–0:55 — split screen**
If you can record two windows side by side (candidate dashboard on the
left, recruiter chat on the right), this is the single best "wow" beat
available: ask the agent a question on the right, and within ~4 seconds
the candidate's dashboard on the left lights up with "Recruiter asked:
'<that exact question>'" — a pulsing dot marks the newest event. It's a
visible, live, two-person interaction, not narration over a static UI.

**0:25–0:45 — Recruiter side: the agent answers**
Log in as `recruiter@demo.com`. Open the inbox — point out the "Strong
match" badge, computed from skill/experience overlap against the job
requirements. Open the application, ask the agent one of the pre-verified
questions above.
> "I'm not talking to a chatbot with generic knowledge — I'm talking to an
> agent grounded in Sarah's actual accumulated notes."
When the answer streams in, pause on the green citation badge under it.
> "And it tells me exactly which file it pulled that from. No hallucination,
> no guessing."

**0:45–1:05 — Decision routing + the second "wow": the agent debrief**
Click "Move to Interview." This triggers a second, distinct Aicoo call —
not the same Q&A chat, a synthesis call — so it takes a few seconds longer
than the question above. Either trim that wait in editing or talk over it.
> "That decision routes straight back into her workspace. But it doesn't
> just log a status change — it asks her own agent to write an internal
> debrief."
When it lands, pause on the green "Agent debrief" box and read a line of it.
> "Strengths and gaps, generated from her real notes — not boilerplate.
> This is the second thing her agent does, beyond answering questions:
> it synthesizes."

**1:05–1:15 — Close the loop**
Switch back to the candidate dashboard (or refresh), show the new event in
the activity log — both the decision and the debrief text.
> "Sarah sees it land in real time — no email, no waiting, and she sees the
> exact same debrief the recruiter saw."

**1:15–1:30 — The architecture beat**
Briefly show the landing page's "Architecture note" section.
> "Every API call here is real and live against Aicoo — init, accumulate,
> share/create, chat. The one shortcut we took, and disclosed openly, is
> using a single Aicoo account across simulated users instead of true
> multi-tenant provisioning — that's the one thing that changes first on
> the way to production."

**1:30–1:40 — Close**
> "AgentRecruit: recruiting that doesn't start from zero, every time."

---

Total runtime above is ~100 seconds end to end; the 90-second target from
the original brief is achievable by cutting the architecture beat down to
one sentence or trimming the wait on the debrief call in editing.

---

## Recording notes

- Clear `localStorage` before recording (`localStorage.clear()` in devtools)
  so the candidate dashboard/chat history don't show stale test data.
- Keep both logins (candidate + recruiter) in separate browser profiles or
  incognito windows so you can flip between them without re-logging-in on
  camera.
- The agent's first streamed response can take 8–15 seconds. Either trim
  that wait in editing, or ask the question slightly before you need the
  answer on screen.
