/**
 * AppHeader — Sticky top bar.
 *
 * Left  : hamburger (mobile), current page title
 * Right : ThemeToggle, UserDropdown
 */
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { useSidebar } from './AppLayout';
import { ThemeToggle } from './ThemeToggle';
import { UserDropdown } from './UserDropdown';

interface AppHeaderProps {
  title: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title }) => {
  const { openMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
      {/* ── Left ── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={openMobile}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 md:hidden dark:hover:bg-neutral-800"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>

        {/* Page title */}
        <h1 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          {title}
        </h1>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserDropdown />
      </div>
    </header>
  );
};
