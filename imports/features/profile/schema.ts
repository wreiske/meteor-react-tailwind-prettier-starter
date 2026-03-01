/**
 * Profile feature — Shared schema (isomorphic).
 *
 * Single source of truth for validation rules and TypeScript types.
 */
import { z } from 'zod';

import {
  PROFILE_BIO_MAX,
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_WEBSITE_MAX,
} from '../../lib/constants';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(PROFILE_DISPLAY_NAME_MAX, `Max ${PROFILE_DISPLAY_NAME_MAX} characters`)
    .default(''),
  bio: z.string().trim().max(PROFILE_BIO_MAX, `Max ${PROFILE_BIO_MAX} characters`).default(''),
  website: z
    .string()
    .trim()
    .max(PROFILE_WEBSITE_MAX, `Max ${PROFILE_WEBSITE_MAX} characters`)
    .refine((v) => !v || /^https?:\/\/.+/.test(v), 'Website must start with http:// or https://')
    .default(''),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ─── Document type ────────────────────────────────────────────────────────────

export interface UserProfileDoc {
  _id?: string;
  userId: string;
  displayName: string;
  bio: string;
  website: string;
  createdAt: Date;
  updatedAt: Date;
}
