import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMatch } from './matchScore.js';

test('two or more overlapping skills is a strong match', () => {
  const result = computeMatch({
    candidateSkills: 'Python, PyTorch, TensorFlow',
    candidateYearsExp: 6,
    requirementsText: '5+ years ML engineering experience\nProduction PyTorch/TensorFlow experience',
  });
  assert.equal(result.label, 'Strong match');
  assert.equal(result.tone, 'seal');
});

test('exactly one overlapping skill is a possible match', () => {
  const result = computeMatch({
    candidateSkills: 'Go, Kubernetes',
    candidateYearsExp: 4,
    requirementsText: '4+ years backend experience\nStrong Go or Node.js skills',
  });
  assert.equal(result.label, 'Possible match');
  assert.equal(result.tone, 'stamp');
});

test('no overlapping skills is limited overlap', () => {
  const result = computeMatch({
    candidateSkills: 'Photoshop, Figma',
    candidateYearsExp: 6,
    requirementsText: '5+ years ML engineering experience\nProduction PyTorch/TensorFlow experience',
  });
  assert.equal(result.label, 'Limited overlap');
  assert.equal(result.tone, 'muted');
});

test('under the required years overrides skill overlap', () => {
  const result = computeMatch({
    candidateSkills: 'Python, PyTorch, TensorFlow',
    candidateYearsExp: 2,
    requirementsText: '5+ years ML engineering experience\nProduction PyTorch/TensorFlow experience',
  });
  assert.equal(result.label, 'Below experience bar');
  assert.equal(result.tone, 'muted');
});

test('missing years or skills data does not throw', () => {
  const result = computeMatch({ candidateSkills: null, candidateYearsExp: undefined, requirementsText: '' });
  assert.equal(result.label, 'Limited overlap');
});
