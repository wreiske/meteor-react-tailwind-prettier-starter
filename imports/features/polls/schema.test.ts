import { describe, expect, it } from 'vitest';

import { POLL_OPTIONS_MAX, POLL_OPTIONS_MIN, POLL_QUESTION_MAX } from '../../lib/constants';
import { pollOptionTextsSchema, pollQuestionSchema } from './schema';

describe('pollQuestionSchema', () => {
  it('accepts valid question', () => {
    expect(pollQuestionSchema.safeParse('What is your favorite color?').success).toBe(true);
  });

  it('rejects empty question', () => {
    expect(pollQuestionSchema.safeParse('').success).toBe(false);
  });

  it(`rejects question over ${POLL_QUESTION_MAX} chars`, () => {
    expect(pollQuestionSchema.safeParse('a'.repeat(POLL_QUESTION_MAX + 1)).success).toBe(false);
  });
});

describe('pollOptionTextsSchema', () => {
  it(`accepts ${POLL_OPTIONS_MIN} options`, () => {
    expect(pollOptionTextsSchema.safeParse(['Red', 'Blue']).success).toBe(true);
  });

  it(`accepts ${POLL_OPTIONS_MAX} options`, () => {
    const opts = Array.from({ length: POLL_OPTIONS_MAX }, (_, i) => `Option ${i + 1}`);
    expect(pollOptionTextsSchema.safeParse(opts).success).toBe(true);
  });

  it('rejects too few options', () => {
    expect(pollOptionTextsSchema.safeParse(['Only one']).success).toBe(false);
  });

  it('rejects too many options', () => {
    const opts = Array.from({ length: POLL_OPTIONS_MAX + 1 }, (_, i) => `Option ${i + 1}`);
    expect(pollOptionTextsSchema.safeParse(opts).success).toBe(false);
  });

  it('rejects empty option text', () => {
    expect(pollOptionTextsSchema.safeParse(['Red', '']).success).toBe(false);
  });
});
