/**
 * Sidebar — Collapsible app navigation.
 *
 * Desktop: fixed width panel, animates between 240 px (expanded) and
 * 64 px (collapsed / icon-only) using a spring.
 *
 * Mobile (< md): hidden by default; slides in as a full-height drawer from
 * the left when isMobileOpen is true in SidebarContext.
 *
 * Labels fade in/out with AnimatePresence so they never clip during resize.
 */
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faChartBar,
  faChevronLeft,
  faChevronRight,
  faComments,
  faGear,
  faList,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

import { REPO_URL } from '../lib/constants';
import { useSidebar } from './AppLayout';
import { useRouter } from './router';

// ─── Nav data ─────────────────────────────────────────────────────────────────

interface NavItem {
  icon: typeof faList;
  label: string;
  href: string;
}

interface NavSection {
  heading?: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    heading: 'Apps',
    items: [
      { icon: faList, label: 'Todos', href: '/app/todos' },
      { icon: faComments, label: 'Chat', href: '/app/chat' },
      { icon: faChartBar, label: 'Polls', href: '/app/polls' },
    ],
  },
  {
    heading: 'System',
    items: [{ icon: faGear, label: 'Settings', href: '/app/settings' }],
  },
];

// ─── NavLink ─────────────────────────────────────────────────────────────────

const NavLink: React.FC<{ item: NavItem; active: boolean; expanded: boolean }> = ({
  item,
  active,
  expanded,
}) => {
  const { navigate } = useRouter();
  return (
    <button
      type="button"
      onClick={() => navigate(item.href)}
      className={[
        'group flex h-9 w-full items-center rounded-lg text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
        expanded ? 'gap-3 px-2.5' : 'justify-center px-0',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
      title={!expanded ? item.label : undefined}
    >
      <FontAwesomeIcon
        icon={item.icon}
        className={[
          'w-4 shrink-0 text-sm',
          active
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-neutral-400 transition-colors group-hover:text-neutral-700 dark:group-hover:text-neutral-200',
        ].join(' ')}
      />
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.span
            key="label"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

// ─── SidebarContent ───────────────────────────────────────────────────────────

const SidebarContent: React.FC = () => {
  const { isExpanded, toggle } = useSidebar();
  const { pathname } = useRouter();

  return (
    <div className="flex h-full flex-col">
      {/* Logo / brand */}
      <div
        className={[
          'flex h-16 shrink-0 items-center border-b border-neutral-200 px-3 dark:border-neutral-800',
          isExpanded ? '' : 'justify-center',
        ].join(' ')}
      >
        {' '}
        <a
          href="/app"
          className="flex min-w-0 items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          aria-label="Home"
        >
          {/* Icon mark */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-sm">
            M
          </div>
          {/* Wordmark */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="wordmark"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <p className="whitespace-nowrap text-sm font-semibold leading-none tracking-tight text-neutral-900 dark:text-neutral-100">
                  Meteor App
                </p>
                <p className="mt-0.5 whitespace-nowrap text-[10px] text-neutral-400 dark:text-neutral-500">
                  v3.4 · React 19
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </a>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4" aria-label="Main navigation">
        {NAV.map((section, si) => (
          <div key={si}>
            {/* Section heading — only shown when expanded */}
            <AnimatePresence initial={false}>
              {isExpanded && section.heading && (
                <motion.p
                  key="heading"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mb-1 overflow-hidden px-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500"
                >
                  {section.heading}
                </motion.p>
              )}
            </AnimatePresence>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <NavLink item={item} active={pathname === item.href} expanded={isExpanded} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-0.5 border-t border-neutral-200 px-2 py-3 dark:border-neutral-800">
        {/* GitHub link */}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={!isExpanded ? 'View on GitHub' : undefined}
          className={[
            'flex h-9 items-center rounded-lg text-sm text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
            isExpanded ? 'gap-3 px-2.5' : 'w-full justify-center px-0',
          ].join(' ')}
        >
          <FontAwesomeIcon icon={faGithub} className="w-4 shrink-0 text-sm" />
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.span
                key="github-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="overflow-hidden whitespace-nowrap"
              >
                GitHub
              </motion.span>
            )}
          </AnimatePresence>
        </a>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggle}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className={[
            'flex h-9 w-full items-center rounded-lg text-sm text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
            isExpanded ? 'gap-3 px-2.5' : 'justify-center px-0',
          ].join(' ')}
        >
          <FontAwesomeIcon
            icon={isExpanded ? faChevronLeft : faChevronRight}
            className="w-4 shrink-0 text-xs"
          />
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.span
                key="collapse-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="overflow-hidden whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export const Sidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* ── Desktop: animated-width panel ─────────────────────────────── */}
      <motion.aside
        className="hidden h-full shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white md:flex dark:border-neutral-800 dark:bg-neutral-900"
        animate={{ width: isExpanded ? 240 : 64 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        <SidebarContent />
      </motion.aside>

      {/* ── Mobile: slide-in drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            className="fixed left-0 top-0 z-30 flex h-full w-60 flex-col overflow-hidden border-r border-neutral-200 bg-white shadow-xl md:hidden dark:border-neutral-800 dark:bg-neutral-900"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            aria-modal
            role="dialog"
            aria-label="Navigation"
          >
            {/* Close button for a11y */}
            <button
              type="button"
              onClick={closeMobile}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Close navigation"
            >
              ✕
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
