function parseRequiredYears(requirementsText) {
  const match = requirementsText.match(/(\d+)\+?\s*years?/i);
  return match ? Number(match[1]) : null;
}

export function computeMatch({ candidateSkills, candidateYearsExp, requirementsText }) {
  const requiredYears = parseRequiredYears(requirementsText || '');
  const skills = (candidateSkills || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const reqLower = (requirementsText || '').toLowerCase();
  const overlap = skills.filter((skill) => skill && reqLower.includes(skill));

  if (requiredYears !== null && candidateYearsExp !== null && candidateYearsExp !== undefined && candidateYearsExp < requiredYears) {
    return { label: 'Below experience bar', tone: 'muted' };
  }
  if (overlap.length >= 2) {
    return { label: 'Strong match', tone: 'seal' };
  }
  if (overlap.length === 1) {
    return { label: 'Possible match', tone: 'stamp' };
  }
  return { label: 'Limited overlap', tone: 'muted' };
}
