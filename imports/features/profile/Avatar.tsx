/**
 * Avatar — Shared deterministic-colour avatar component.
 *
 * Displays the first character of `label` (or `seed`) inside a circle whose
 * background colour is derived from a hash of `seed`.  No images required.
 *
 * Usage:
 *   <Avatar seed={email} label={displayName} size="md" />
 *   <Avatar seed={email} size="sm" />   // falls back to first char of seed
 *   <Avatar seed={email} size="lg" />   // profile page header
 */
import React from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  /** String used for deterministic colour hashing (email, userId, etc.) */
  seed?: string;
  /** Display text whose first character is used as the initial. Falls back to seed. */
  label?: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-16 w-16 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({ seed, label, size = 'md', className = '' }) => {
  const text = label ?? seed ?? '';
  const initials = text ? text[0].toUpperCase() : '?';
  // Deterministic pastel hue from seed hash (no crypto — just colour picking)
  const hue = seed ? [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360 : 200;

  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none ${SIZE_CLASSES[size]} ${className}`.trim()}
      style={{ backgroundColor: `hsl(${hue},60%,52%)` }}
    >
      {initials}
    </div>
  );
};
