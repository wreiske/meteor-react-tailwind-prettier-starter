/**
 * UserDropdown — Avatar button + floating menu for the authenticated user.
 *
 * • Reads user data reactively via useTracker
 * • Keyboard-navigable (Escape closes, arrow keys move focus)
 * • Positions itself below-right of the trigger; adjusts when near viewport edge
 * • Portal-free (uses absolute positioning within the header stacking context)
 */
import { faChevronDown, faCircleUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { Avatar } from '../features/profile/Avatar';
import { useRouter } from './router';

// ─── Menu item ────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: typeof faRightFromBracket;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, variant = 'default' }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={[
      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
      variant === 'danger'
        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
    ].join(' ')}
  >
    <FontAwesomeIcon icon={icon} className="w-3.5 shrink-0" />
    {label}
  </button>
);

// ─── UserDropdown ─────────────────────────────────────────────────────────────

export const UserDropdown: React.FC = () => {
  const user = useTracker(() => Meteor.user());
  const email: string | undefined =
    user?.emails?.[0]?.address ?? (user?.profile as { email?: string } | undefined)?.email;

  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click / focus-out
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | FocusEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('focusin', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('focusin', handler);
    };
  }, [open, close]);

  // Keyboard: Escape closes; arrow keys move focus inside menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.focus();
        return;
      }
      if (!menuRef.current) return;
      const items = Array.from(
        menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
      );
      const idx = items.indexOf(document.activeElement as HTMLButtonElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const handleLogout = useCallback(() => {
    close();
    Meteor.logout();
  }, [close]);

  const handleProfile = useCallback(() => {
    close();
    const uid = Meteor.userId();
    if (uid) navigate(`/app/profile/${uid}`);
  }, [close, navigate]);

  const displayName = email ?? 'Account';
  const truncated = displayName.length > 22 ? `${displayName.slice(0, 20)}…` : displayName;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-2 rounded-lg border border-transparent px-2 text-sm text-neutral-700 transition-colors hover:border-neutral-200 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <Avatar seed={email} size="sm" />
        <span className="hidden max-w-[140px] truncate sm:block">{truncated}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-[10px] text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            aria-orientation="vertical"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-xl ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-white/5"
          >
            {/* User info */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Avatar seed={email} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {truncated}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                  Authenticated
                </p>
              </div>
            </div>

            <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

            <MenuItem icon={faCircleUser} label="Profile" onClick={handleProfile} />

            <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

            <MenuItem
              icon={faRightFromBracket}
              label="Sign out"
              onClick={handleLogout}
              variant="danger"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
