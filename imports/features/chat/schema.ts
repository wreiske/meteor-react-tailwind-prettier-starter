/**
 * Chat feature — Shared schema (isomorphic).
 *
 * Single source of truth for validation rules and TypeScript types.
 */
import { z } from 'zod';

import { CHAT_MESSAGE_MAX, CHAT_ROOM_NAME_MAX } from '../../lib/constants';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const chatMessageTextSchema = z
  .string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(CHAT_MESSAGE_MAX, `Keep it under ${CHAT_MESSAGE_MAX} chars`);

export const chatRoomNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Room name required')
  .max(CHAT_ROOM_NAME_MAX, `Keep it under ${CHAT_ROOM_NAME_MAX} chars`)
  .regex(/^[a-z0-9-]+$/, 'Only letters, numbers, and hyphens allowed')
  .transform((s) => s.replace(/\s+/g, '-'));

export const roomIdSchema = z.string().min(1);
export const messageLimitSchema = z.coerce.number().int().min(1).max(200).default(50);

// ─── Document types ───────────────────────────────────────────────────────────

export interface ChatRoomDoc {
  _id?: string;
  name: string;
  createdAt: Date;
  createdBy: string;
}

export interface ChatMessageDoc {
  _id?: string;
  roomId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: Date;
}
