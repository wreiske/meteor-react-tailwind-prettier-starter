import { describe, expect, it } from 'vitest';

import {
  PROFILE_BIO_MAX,
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_WEBSITE_MAX,
} from '../../lib/constants';
import { profileUpdateSchema } from './schema';

describe('profileUpdateSchema', () => {
  it('accepts valid profile update', () => {
    const result = profileUpdateSchema.safeParse({
      displayName: 'Alice',
      bio: 'Hello world',
      website: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('allows empty optional fields', () => {
    const result = profileUpdateSchema.safeParse({
      displayName: '',
      bio: '',
      website: '',
    });
    expect(result.success).toBe(true);
  });

  it(`rejects displayName over ${PROFILE_DISPLAY_NAME_MAX} chars`, () => {
    const result = profileUpdateSchema.safeParse({
      displayName: 'a'.repeat(PROFILE_DISPLAY_NAME_MAX + 1),
      bio: '',
      website: '',
    });
    expect(result.success).toBe(false);
  });

  it(`rejects bio over ${PROFILE_BIO_MAX} chars`, () => {
    const result = profileUpdateSchema.safeParse({
      displayName: '',
      bio: 'a'.repeat(PROFILE_BIO_MAX + 1),
      website: '',
    });
    expect(result.success).toBe(false);
  });

  it(`rejects website over ${PROFILE_WEBSITE_MAX} chars`, () => {
    const result = profileUpdateSchema.safeParse({
      displayName: '',
      bio: '',
      website: 'a'.repeat(PROFILE_WEBSITE_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from fields', () => {
    const result = profileUpdateSchema.safeParse({
      displayName: '  Alice  ',
      bio: '  Hi  ',
      website: '  https://example.com  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe('Alice');
      expect(result.data.bio).toBe('Hi');
      expect(result.data.website).toBe('https://example.com');
    }
  });
});
