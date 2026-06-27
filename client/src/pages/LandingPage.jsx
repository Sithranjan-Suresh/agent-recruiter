import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  {
    label: 'Open a file',
    body: 'Candidates fill out their profile once. It’s accumulated into a real Aicoo workspace as structured context — not a PDF.',
  },
  {
    label: 'Send the agent',
    body: 'One click creates a scoped 7-day Aicoo share link and introduces the candidate’s agent to the recruiter’s inbox.',
  },
  {
    label: 'Let it answer',
    body: 'The recruiter asks the agent anything. It answers live, streamed, from the candidate’s own profile — never generic knowledge.',
  },
  {
    label: 'Close the loop',
    body: 'A decision — interview, hold, or pass — routes straight back into the candidate’s workspace and dashboard.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="px-6 pt-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-ink">
            AgentRecruit<span className="text-stamp">.</span>
          </span>
          <Link to={user ? (user.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/inbox') : '/login'} className="eyebrow text-ink-soft hover:text-ink transition-colors">
            {user ? 'Open dashboard' : 'Log in'}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        <section className="pt-16 pb-12 text-center">
          <p className="eyebrow mb-3">Case file 001 — the recruiting problem</p>
          <h1 className="text-4xl md:text-5xl font-display font-semibold text-ink leading-tight max-w-3xl mx-auto">
            The average job posting gets 250 applications.
            <br />
            Recruiters spend 6 seconds on each one.
          </h1>
          <p className="text-ink-soft max-w-xl mx-auto mt-5">
            AgentRecruit gives every candidate a persistent AI agent that carries their case file into every recruiter
            conversation — so nobody repeats themselves, and nobody gets six seconds.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              to="/signup"
              className="stamp-press font-display font-semibold bg-stamp text-white rounded-sm px-5 py-2.5 hover:bg-stamp-dark transition-colors"
            >
              I'm a candidate
            </Link>
            <Link
              to="/signup"
              className="stamp-press font-display font-semibold border-[1.5px] border-ink text-ink rounded-sm px-5 py-2.5 hover:bg-ink/5 transition-colors"
            >
              I'm a recruiter
            </Link>
          </div>
          <p className="eyebrow mt-4">
            Already have an account? <Link to="/login" className="text-stamp-dark">Log in</Link> · <Link to="/jobs" className="text-stamp-dark">Browse open roles</Link>
          </p>
        </section>

        <section className="pb-16">
          <p className="eyebrow mb-1 text-center">How the case moves</p>
          <h2 className="text-2xl font-display font-semibold text-ink text-center mb-10">From profile to decision, no resume required</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <div key={step.label} className="bg-paper-card border border-line rounded-md p-5">
                <p className="eyebrow mb-2">Step {i + 1}</p>
                <h3 className="font-display font-semibold text-ink mb-2">{step.label}</h3>
                <p className="text-sm text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <div className="bg-paper-card border border-line rounded-md p-6">
            <p className="eyebrow mb-2">Architecture note — read before you ask</p>
            <h3 className="font-display font-semibold text-ink mb-2">Why every demo account shares one Aicoo key</h3>
            <p className="text-sm text-ink-soft max-w-2xl">
              Aicoo currently issues one API key per developer account from its dashboard — there's no programmatic
              endpoint to provision a new account or key per end user. So instead of pretending otherwise, every
              simulated user in this build shares one real Aicoo key, and we isolate workspaces ourselves with folder
              namespacing (<code className="font-mono text-xs">Candidates/{`{id}`}/...</code>) at the application layer.
              It's a real engineering response to a real platform constraint, documented in{' '}
              <code className="font-mono text-xs">engineering_spec.md</code> — the moment Aicoo exposes per-tenant
              provisioning, this is a one-file change, not a rearchitecture.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
