/**
 * Shared constants — single source of truth for limits, keys, and app-wide values.
 *
 * Import from both client and server to avoid duplicated magic numbers.
 */

// ─── Validation limits ────────────────────────────────────────────────────────

export const TODO_TEXT_MAX = 200;
export const CHAT_MESSAGE_MAX = 2000;
export const CHAT_ROOM_NAME_MAX = 50;
export const POLL_QUESTION_MAX = 300;
export const POLL_OPTION_MAX = 100;
export const POLL_OPTIONS_MIN = 2;
export const POLL_OPTIONS_MAX = 8;
export const PROFILE_DISPLAY_NAME_MAX = 50;
export const PROFILE_BIO_MAX = 300;
export const PROFILE_WEBSITE_MAX = 200;

// ─── Storage keys ─────────────────────────────────────────────────────────────

export const THEME_KEY = 'app:theme' as const;
export const SIDEBAR_KEY = 'app:sidebar' as const;

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const REPO_URL =
  'https://github.com/wreiske/meteor-react-tailwind-prettier-starter' as const;
