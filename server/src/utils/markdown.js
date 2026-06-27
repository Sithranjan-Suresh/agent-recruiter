export function formatProfileOverview(profile) {
  const { name, targetRole, yearsExp, skills = [], goals, portfolioUrl } = profile;
  return `# ${name} — Recruiting Profile

## Target Role
${targetRole}

## Summary
${goals || ''}

## Experience
${yearsExp} years of experience

## Core Skills
${skills.join(', ')}

## Portfolio
${portfolioUrl || 'Not provided'}
`;
}

export function formatExperienceEntry(entry) {
  const { company, title, dates, summary } = entry;
  return `# ${company} — ${title}
${dates}

${summary || ''}
`;
}

export function formatJobPosting(job) {
  const { title, team, location, summary, requirements = [], niceToHaves } = job;
  return `# ${title}

**Team:** ${team || 'N/A'}
**Location:** ${location || 'N/A'}

## Summary
${summary || ''}

## Requirements
${requirements.map((r) => `- ${r}`).join('\n')}

## Nice to Haves
${niceToHaves || ''}
`;
}

export function formatCompanyOverview(recruiter) {
  const { name, company, title, teamDescription } = recruiter;
  return `# ${company} — Recruiting Context

**Recruiter:** ${name} (${title})

## Team
${teamDescription || ''}
`;
}

export function formatDecision(decision, recruiterCompany, debrief) {
  return `# Application Decision

**Decision:** ${decision}
**Date:** ${new Date().toISOString()}
**Recruiter Company:** ${recruiterCompany}

## Agent Debrief
${debrief || 'Not generated.'}
`;
}
