/**
 * SettingsPage — User & application settings.
 *
 * Sections:
 *   • Profile       — email (read-only for passwordless accounts)
 *   • Appearance    — theme toggle + colour scheme preference
 *   • Account       — danger zone: sign out
 *   • About         — stack versions, repo link
 */
import {
  faCircleUser,
  faGear,
  faInfo,
  faMoon,
  faPalette,
  faRightFromBracket,
  faSun,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useEffect, useState } from 'react';

// ─── Primitives ───────────────────────────────────────────────────────────────

const Section: React.FC<{
  icon: typeof faGear;
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <section className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
      </div>
    </div>
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">{children}</div>
  </section>
);

const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <div className="flex items-center justify-between gap-4 px-5 py-3.5">
    <div className="min-w-0">
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{hint}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
    {children}
  </span>
);

// ─── Theme selector ───────────────────────────────────────────────────────────

const THEME_KEY = 'app:theme' as const;

function getTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null) ?? 'light';
}

function applyTheme(t: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', t === 'dark');
  root.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
}

const ThemeSelector: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const options: { value: 'light' | 'dark'; icon: typeof faSun; label: string }[] = [
    { value: 'light', icon: faSun, label: 'Light' },
    { value: 'dark', icon: faMoon, label: 'Dark' },
  ];

  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex gap-2">
      {options.map(({ value, icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={[
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
            theme === value
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800',
          ].join(' ')}
        >
          <FontAwesomeIcon icon={icon} className="text-xs" />
          {label}
        </button>
      ))}
    </div>
  );
};

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const user = useTracker(() => Meteor.user());
  const email: string | undefined =
    user?.emails?.[0]?.address ?? (user?.profile as { email?: string } | undefined)?.email;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      {/* Profile */}
      <Section
        icon={faCircleUser}
        title="Profile"
        description="Your account information. Email is managed by the passwordless auth system."
      >
        <Row label="Email address" hint="Used for magic-link sign-in">
          <span className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {email ?? '—'}
          </span>
        </Row>
        <Row label="User ID" hint="Internal Meteor user identifier">
          <Badge>{user?._id ?? '—'}</Badge>
        </Row>
      </Section>

      {/* Appearance */}
      <Section
        icon={faPalette}
        title="Appearance"
        description="Control how the application looks on this device."
      >
        <Row label="Colour theme" hint="Persisted in localStorage for this browser">
          <ThemeSelector />
        </Row>
      </Section>

      {/* Account */}
      <Section icon={faGear} title="Account">
        <Row label="Sign out" hint="You will be returned to the login screen">
          <button
            type="button"
            onClick={() => Meteor.logout()}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-xs" />
            Sign out
          </button>
        </Row>
      </Section>

      {/* About */}
      <Section icon={faInfo} title="About" description="Stack versions for this application.">
        {(
          [
            ['Meteor', '3.4'],
            ['React', '19'],
            ['Tailwind CSS', '4'],
            ['TypeScript', '5'],
            ['Node.js', '22'],
          ] as const
        ).map(([name, version]) => (
          <Row key={name} label={name}>
            <Badge>{version}</Badge>
          </Row>
        ))}
        <Row label="Source code">
          <a
            href="https://github.com/wreiske/meteor-react-tailwind-prettier-starter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400"
          >
            GitHub ↗
          </a>
        </Row>
      </Section>
    </div>
  );
};
