import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatProfileOverview, formatExperienceEntry, formatJobPosting, formatDecision } from './markdown.js';

test('formatProfileOverview includes all profile fields', () => {
  const md = formatProfileOverview({
    name: 'Sarah Chen',
    targetRole: 'Senior ML Engineer',
    yearsExp: 6,
    skills: ['Python', 'PyTorch'],
    goals: 'Build ranking systems',
    portfolioUrl: 'https://github.com/sarahchen',
  });
  assert.match(md, /Sarah Chen/);
  assert.match(md, /Senior ML Engineer/);
  assert.match(md, /6 years of experience/);
  assert.match(md, /Python, PyTorch/);
  assert.match(md, /https:\/\/github\.com\/sarahchen/);
});

test('formatProfileOverview handles missing optional fields without throwing', () => {
  const md = formatProfileOverview({ name: 'Jane', targetRole: 'Engineer', yearsExp: 1, skills: [] });
  assert.match(md, /Not provided/);
});

test('formatExperienceEntry includes company, title, and dates', () => {
  const md = formatExperienceEntry({ company: 'Acme Corp', title: 'ML Engineer', dates: '2021 - Present', summary: 'Built things.' });
  assert.match(md, /Acme Corp/);
  assert.match(md, /ML Engineer/);
  assert.match(md, /2021 - Present/);
});

test('formatJobPosting lists every requirement as a bullet', () => {
  const md = formatJobPosting({
    title: 'Backend Engineer',
    team: 'Infra',
    location: 'Remote',
    summary: 'Build things.',
    requirements: ['4+ years experience', 'Strong Go skills'],
  });
  assert.match(md, /- 4\+ years experience/);
  assert.match(md, /- Strong Go skills/);
});

test('formatDecision embeds the debrief text when provided', () => {
  const md = formatDecision('interview', 'Stripe', 'Strong hands-on engineer.');
  assert.match(md, /\*\*Decision:\*\* interview/);
  assert.match(md, /Stripe/);
  assert.match(md, /Strong hands-on engineer\./);
});

test('formatDecision falls back gracefully with no debrief', () => {
  const md = formatDecision('hold', 'Stripe', '');
  assert.match(md, /Not generated\./);
});
