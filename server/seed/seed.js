import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from '../src/db/db.js';
import { encrypt } from '../src/utils/encrypt.js';
import { initWorkspace, accumulateContext, createShareLink } from '../src/services/aicooService.js';
import { formatProfileOverview, formatExperienceEntry, formatJobPosting, formatCompanyOverview } from '../src/utils/markdown.js';

async function upsertUser({ email, password, role, name, company }) {
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (user) return user;

  const apiKey = process.env.AICOO_API_KEY;
  await initWorkspace(apiKey);

  const id = uuid();
  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, role, name, company, aicoo_api_key, aicoo_initialized)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
  ).run(id, email, passwordHash, role, name, company || null, encrypt(apiKey));

  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export async function seedDemoData() {
  console.log('Seeding demo data...');

  const candidate = await upsertUser({
    email: 'candidate@demo.com',
    password: 'demo123',
    role: 'candidate',
    name: 'Sarah Chen',
  });

  const recruiter = await upsertUser({
    email: 'recruiter@demo.com',
    password: 'demo123',
    role: 'recruiter',
    name: 'Alex Rivera',
    company: 'Stripe',
  });

  const candidateApiKey = process.env.AICOO_API_KEY;

  if (!candidate.aicoo_initialized) {
    const profile = {
      name: candidate.name,
      targetRole: 'Senior Machine Learning Engineer',
      yearsExp: 6,
      skills: ['Python', 'PyTorch', 'TensorFlow', 'MLOps', 'Distributed Training'],
      goals: 'Looking for a senior ML role building production recommendation or ranking systems.',
      portfolioUrl: 'https://github.com/sarahchen',
    };
    const workHistory = [
      {
        company: 'Acme Corp',
        title: 'ML Engineer',
        dates: '2021 - Present',
        summary: 'Built and shipped the core recommendation engine serving 10M+ users; reduced inference latency 40% via model distillation.',
      },
      {
        company: 'DataWorks',
        title: 'Data Scientist',
        dates: '2019 - 2021',
        summary: 'Built fraud detection models and the feature pipeline that fed them.',
      },
    ];

    await accumulateContext(candidateApiKey, [
      { path: `Candidates/${candidate.id}/Profile/overview.md`, content: formatProfileOverview(profile) },
      ...workHistory.map((entry) => ({
        path: `Candidates/${candidate.id}/Profile/experience/${entry.company}.md`,
        content: formatExperienceEntry(entry),
      })),
    ]);
    db.prepare(
      'UPDATE users SET aicoo_initialized = 1, years_exp = ?, skills = ?, target_role = ?, goals = ?, portfolio_url = ?, work_history = ? WHERE id = ?'
    ).run(
      profile.yearsExp,
      profile.skills.join(','),
      profile.targetRole,
      profile.goals,
      profile.portfolioUrl,
      JSON.stringify(workHistory),
      candidate.id
    );
    console.log('Candidate profile accumulated.');
  }

  await accumulateContext(candidateApiKey, [
    {
      path: `Recruiters/${recruiter.id}/Company/overview.md`,
      content: formatCompanyOverview({ name: recruiter.name, company: recruiter.company, title: 'Engineering Recruiter', teamDescription: 'Hiring for the ML Platform team.' }),
    },
  ]);

  const jobs = [
    {
      title: 'Senior ML Engineer',
      team: 'ML Platform',
      location: 'Remote (US)',
      summary: 'Own the recommendation and ranking systems powering checkout.',
      requirements: ['5+ years ML engineering experience', 'Production PyTorch/TensorFlow experience', 'Comfortable owning systems end-to-end'],
      niceToHaves: 'Distributed training experience',
    },
    {
      title: 'Backend Engineer, Payments Infra',
      team: 'Payments Infra',
      location: 'San Francisco, CA',
      summary: 'Build the infrastructure behind global payment processing.',
      requirements: ['4+ years backend experience', 'Distributed systems experience', 'Strong Go or Node.js skills'],
      niceToHaves: 'Experience with high-availability financial systems',
    },
  ];

  for (const job of jobs) {
    const existing = db.prepare('SELECT id FROM jobs WHERE recruiter_id = ? AND title = ?').get(recruiter.id, job.title);
    if (existing) continue;
    await accumulateContext(candidateApiKey, [
      { path: `Recruiters/${recruiter.id}/Jobs/${job.title}.md`, content: formatJobPosting(job) },
    ]);
    db.prepare(
      `INSERT INTO jobs (id, recruiter_id, title, team, location, summary, requirements, nice_to_haves)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(uuid(), recruiter.id, job.title, job.team, job.location, job.summary, job.requirements.join('\n'), job.niceToHaves);
  }
  console.log('Jobs seeded.');

  const job = db.prepare('SELECT id, title FROM jobs WHERE recruiter_id = ? LIMIT 1').get(recruiter.id);
  const existingApp = db.prepare('SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?').get(candidate.id, job.id);
  if (!existingApp) {
    const shareResult = await createShareLink(candidateApiKey, {
      scope: 'all',
      access: 'read',
      label: `${candidate.name} → ${job.title} at ${recruiter.company}`,
      expiresIn: '7d',
    });
    const shareLink = shareResult.shareLink;
    db.prepare(
      `INSERT INTO applications (id, candidate_id, job_id, status, share_link_id, share_link_url, agent_url)
       VALUES (?, ?, ?, 'agent_intro_sent', ?, ?, ?)`
    ).run(uuid(), candidate.id, job.id, shareLink.id, shareLink.url, shareLink.url);
    console.log('Seed application created.');
  }

  console.log('Seed complete. Demo accounts: candidate@demo.com / recruiter@demo.com (password: demo123)');
}

const isMain = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isMain) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
