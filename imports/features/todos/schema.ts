/**
 * Todos feature — Shared schema (isomorphic).
 *
 * Single source of truth for validation rules and TypeScript types.
 * Used by both server methods and client forms.
 */
import { z } from 'zod';

import { TODO_TEXT_MAX } from '../../lib/constants';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const todoTextSchema = z
  .string()
  .trim()
  .min(1, 'Todo text required')
  .max(TODO_TEXT_MAX, `Keep it under ${TODO_TEXT_MAX} chars`);

export const todoIdSchema = z.string().min(1);

export const todoFilterSchema = z.enum(['all', 'active', 'completed']).default('all');

// ─── Document type ────────────────────────────────────────────────────────────

export interface TodoDoc {
  _id?: string;
  userId: string;
  text: string;
  done: boolean;
  createdAt: Date;
  order?: number;
}

export type TodoFilter = z.infer<typeof todoFilterSchema>;
