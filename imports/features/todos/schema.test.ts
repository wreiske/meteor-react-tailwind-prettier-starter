import { describe, expect, it } from 'vitest';

import { TODO_TEXT_MAX } from '../../lib/constants';
import { todoFilterSchema, todoIdSchema, todoTextSchema } from './schema';

describe('todoTextSchema', () => {
  it('accepts valid text', () => {
    expect(todoTextSchema.safeParse('Buy milk').success).toBe(true);
  });

  it('trims whitespace', () => {
    const result = todoTextSchema.safeParse('  hello  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('hello');
  });

  it('rejects empty string', () => {
    expect(todoTextSchema.safeParse('').success).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(todoTextSchema.safeParse('   ').success).toBe(false);
  });

  it(`rejects text over ${TODO_TEXT_MAX} chars`, () => {
    expect(todoTextSchema.safeParse('a'.repeat(TODO_TEXT_MAX + 1)).success).toBe(false);
  });

  it(`accepts text exactly ${TODO_TEXT_MAX} chars`, () => {
    expect(todoTextSchema.safeParse('a'.repeat(TODO_TEXT_MAX)).success).toBe(true);
  });
});

describe('todoIdSchema', () => {
  it('accepts a non-empty string', () => {
    expect(todoIdSchema.safeParse('abc123').success).toBe(true);
  });

  it('rejects empty string', () => {
    expect(todoIdSchema.safeParse('').success).toBe(false);
  });
});

describe('todoFilterSchema', () => {
  it('accepts valid filters', () => {
    for (const v of ['all', 'active', 'completed']) {
      expect(todoFilterSchema.safeParse(v).success).toBe(true);
    }
  });

  it('defaults to "all"', () => {
    const result = todoFilterSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('all');
  });

  it('rejects invalid values', () => {
    expect(todoFilterSchema.safeParse('invalid').success).toBe(false);
  });
});
