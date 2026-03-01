/**
 * Polls feature — Shared schema (isomorphic).
 *
 * Single source of truth for validation rules and TypeScript types.
 */
import { z } from 'zod';

import {
  POLL_OPTION_MAX,
  POLL_OPTIONS_MAX,
  POLL_OPTIONS_MIN,
  POLL_QUESTION_MAX,
} from '../../lib/constants';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const pollQuestionSchema = z
  .string()
  .trim()
  .min(1, 'Question required')
  .max(POLL_QUESTION_MAX, `Question too long (max ${POLL_QUESTION_MAX})`);

export const pollOptionTextsSchema = z
  .array(z.string().trim().min(1, 'All options must have text').max(POLL_OPTION_MAX))
  .min(POLL_OPTIONS_MIN, `${POLL_OPTIONS_MIN}–${POLL_OPTIONS_MAX} options required`)
  .max(POLL_OPTIONS_MAX, `${POLL_OPTIONS_MIN}–${POLL_OPTIONS_MAX} options required`);

export const pollIdSchema = z.string().min(1);
export const optionIdSchema = z.string().min(1);

// ─── Document types ───────────────────────────────────────────────────────────

export interface PollOption {
  id: string;
  text: string;
}

export interface PollDoc {
  _id?: string;
  userId: string;
  question: string;
  options: PollOption[];
  createdAt: Date;
  isOpen: boolean;
}

export interface VoteDoc {
  _id?: string;
  pollId: string;
  userId: string;
  optionId: string;
  createdAt: Date;
}
