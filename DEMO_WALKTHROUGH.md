# AgentRecruit — Exact Click-by-Click Recording Walkthrough

Use this alongside [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — that file has the
narration to say out loud; this file is the literal sequence of screens,
URLs, and clicks, in order, so you never have to improvise where to go.

Replace `<your-url>` below with your deployed URL once it's live. Do one
full dry run before recording for real — the agent's responses take
8–20 seconds, and you want to know that rhythm before you're on camera.

---

## Before you hit record

1. Open two browser windows (or two profiles): **Window A** for the
   candidate, **Window B** for the recruiter. Side by side if your
   screen allows — this is what makes the live-update moment (step 9)
   land.
2. In both windows, open devtools console and run `localStorage.clear()`,
   then refresh. This wipes any stale chat history so the demo starts clean.
3. Confirm you can log in to both demo accounts before recording:
   - `candidate@demo.com` / `demo123`
   - `recruiter@demo.com` / `demo123`

---

## Recording sequence

**1. Window A → `<your-url>/`**
Landing page. Let the hero load. Scroll slowly through the 4-step
"How the case moves" section. Don't click anything yet — this is pure
narration over the page (see DEMO_SCRIPT.md 0:00–0:10).

**2. Window A → click "I'm a candidate"**
Lands on `/signup` with "Candidate" already selected. Don't actually sign
up on camera — instead, navigate directly to `/login` (faster, avoids a
live profile-setup detour) and log in as `candidate@demo.com`.

**3. Window A — now on `/candidate/dashboard`**
This is the candidate's home base. Point out:
   - "Your agent is active on 1 role" line
   - The `INTERVIEW` status badge (already set from prior testing — if
     you reseed the demo DB before recording, this will instead say
     `INTRO SENT`, which is also fine, just narrate accordingly)
   - The activity log underneath, newest event at top with the pulsing dot

**4. Window B → `<your-url>/login`, log in as `recruiter@demo.com`**
Lands on `/recruiter/inbox`.

**5. Window B — Inbox**
Point out the `STRONG MATCH` badge next to "Sarah Chen → Senior ML
Engineer." Click that row.

**6. Window B — now on `/recruiter/applications/<id>`**
This is the agent chat + decision screen. Point out the match badge next
to "Sarah Chen" in the header.

**7. Window B — type a question and click Send**
Use one of the pre-verified questions from DEMO_SCRIPT.md, e.g.
*"What is her experience with PyTorch?"* Wait for the streamed response
(8–15s — keep talking over it, per the script).

**8. Window B — when the answer lands, point at the green citation chip**
("✓ Profile/overview.md" or similar) directly under the response. This
is the "not a generic guess" beat.

**9. Cut to both windows side by side (or quick-switch to Window A)**
Within ~4 seconds of step 7, Window A's dashboard auto-updates with
"Recruiter asked: '<the exact question>'" and a pulsing dot, with zero
manual refresh. This is the single best live-interaction shot in the
whole demo — hold on it for 2–3 seconds.

**10. Back to Window B — click "Move to Interview"**
Buttons now show "Recording…" and a status line ("Asking the candidate's
agent to write a debrief…") for several seconds — narrate over this, per
DEMO_SCRIPT.md 0:45–1:05.

**11. Window B — the green "Agent debrief — internal handoff" box appears**
Read one line of it out loud. This is the second "wow" — a synthesized,
specific assessment (strengths *and* gaps), not boilerplate.

**12. Cut to Window A — refresh or wait for its next poll**
The same decision + the same debrief text now appear in the candidate's
own activity log. Point out it's the same debrief both sides saw.

**13. Either window → scroll the landing page's "Architecture note" section**
(Easiest: open a new tab to `<your-url>/` and scroll down.) Read the one
sentence about the Aicoo single-key constraint — this is the "we know our
own limitations" credibility beat.

**14. End on the landing page hero or the candidate dashboard — your choice**
Whichever frames the closing line from DEMO_SCRIPT.md best.

---

## After recording

- Trim dead air during the 8–20s agent-response waits if your narration
  didn't fully cover them.
- If you recorded windows separately instead of side-by-side, the cut
  in step 9 is the one moment worth a picture-in-picture or quick
  split-screen edit if you have time — it's the highest-leverage shot.
- Re-watch once before submitting and check: does every claim in the
  narration match what's literally on screen at that moment? Judges
  notice mismatches.
