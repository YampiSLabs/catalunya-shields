import { expect, test } from 'vitest';
import { scoreCandidate } from '../scripts/shared/candidates.js';

test('candidate scoring', () => {
  const file1 = { title: "Escut de Barcelona.svg", mime: "image/svg+xml" };
  expect(scoreCandidate(file1, "Barcelona").confidence).toBe('high');
  
  const file2 = { title: "Flag of Barcelona.svg", mime: "image/svg+xml" };
  expect(scoreCandidate(file2, "Barcelona").confidence).not.toBe('high');
});
