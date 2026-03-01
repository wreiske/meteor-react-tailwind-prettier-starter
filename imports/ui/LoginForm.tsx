import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faBolt,
  faChartBar,
  faComments,
  faInbox,
  faList,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';

import { Button } from './Button';
import { Input } from './Input';
import { ThemeToggle } from './ThemeToggle';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'signup';

interface LoginFormProps {
  initialMode?: AuthMode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMode(): AuthMode {
  if (typeof window === 'undefined') return 'login';
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'signup' ? 'signup' : 'login';
}

function setModeParam(mode: AuthMode) {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', mode);
  window.history.replaceState(null, '', url.toString());
}

// ─── Marketing panel bullets ──────────────────────────────────────────────────

const FEATURES = [
  { icon: faComments, text: 'Real-time chat with multi-room support' },
  { icon: faChartBar, text: 'Live polls with instant vote updates' },
  { icon: faList, text: 'Reactive todos with drag-to-reorder' },
  { icon: faBolt, text: 'Instant DDP sync — no polling, no REST' },
  { icon: faShieldHalved, text: 'Passwordless magic link authentication' },
] as const;

export const LoginForm: React.FC<LoginFormProps> = ({ initialMode }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode ?? getMode());
  const [email, setEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [tokenValue, setTokenValue] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [loggingInToken, setLoggingInToken] = useState(false);
  const [justResent, setJustResent] = useState(false);
  const [devInbox, setDevInbox] = useState(false);

  const isSignup = mode === 'signup';

  const toggleMode = () => {
    const next: AuthMode = isSignup ? 'login' : 'signup';
    setMode(next);
    setModeParam(next);
  };

  const normalizedEmail = () => email.trim().toLowerCase();

  const sendMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || sendingLink) return;
    setSendingLink(true);
    setLinkError(null);
    const normalized = normalizedEmail();
    // @ts-expect-error provided by accounts-passwordless
    Accounts.requestLoginTokenForUser(
      { selector: normalized, userData: { email: normalized } },
      (err: { reason?: string; message?: string } | null) => {
        if (err) {
          setLinkError(err.reason || err.message || 'Error sending link');
          setSendingLink(false);
          return;
        }
        setMagicLinkSent(true);
        setSendingLink(false);
        setJustResent(false);
        Meteor.call(
          'inbox.isDevMode',
          (_e: unknown, result: boolean) => result && setDevInbox(true),
        );
      },
    );
  };
  const loginWithToken = () => {
    if (!tokenValue || loggingInToken) return;
    setLoggingInToken(true);
    setTokenError(null);
    const selector = email.trim().toLowerCase();
    const token = tokenValue.trim();
    type PwdlessFn = (
      selector: string,
      token: string,
      cb: (err: { reason?: string; message?: string } | null) => void,
    ) => void;
    const pwdlessFn = (Meteor as unknown as { passwordlessLoginWithToken?: PwdlessFn })
      .passwordlessLoginWithToken;
    if (typeof pwdlessFn !== 'function') {
      setTokenError('passwordlessLoginWithToken not available');
      setLoggingInToken(false);
      return;
    }
    pwdlessFn(selector, token, (err: { reason?: string; message?: string } | null) => {
      if (err) setTokenError(err.reason || err.message || 'Login failed');
      setLoggingInToken(false);
    });
  };

  // ── Marketing panel (left) ──────────────────────────────────────────────────

  const MarketingPanel = () => (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white md:flex md:w-1/2 lg:p-14">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10" />

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
            {isSignup ? 'Start building in minutes' : 'Welcome back'}
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-blue-100 lg:text-lg">
            {isSignup
              ? 'Create your free account and explore real-time chat, live polls, and reactive todos — all powered by Meteor DDP.'
              : 'Sign in to pick up right where you left off. Your data syncs in real-time across every device.'}
          </p>
        </div>

        <ul className="space-y-3">
          {FEATURES.map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-blue-100">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <FontAwesomeIcon icon={icon} className="text-sm" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-8 flex items-center gap-3 border-t border-white/20 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
          M
        </div>
        <div>
          <p className="text-sm font-semibold">Meteor 3.5 + React 19</p>
          <p className="text-xs text-blue-200">Tailwind CSS 4 · TypeScript 5 · Node 22</p>
        </div>
      </div>
    </div>
  );

  // ── Layout ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen w-full font-sans text-neutral-800 dark:text-neutral-100">
      <MarketingPanel />

      <div className="relative flex w-full flex-col items-center justify-center px-6 py-12 md:w-1/2 md:px-12 lg:px-20">
        {/* Top bar — GitHub + theme toggle */}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <a
            href="https://github.com/wreiske/meteor-react-tailwind-prettier-starter"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 shadow-sm transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <FontAwesomeIcon icon={faGithub} className="text-base" />
          </a>
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile-only branding */}
          <div className="mb-8 md:hidden">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Todo Sample App
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Real-time Meteor + React demo
            </p>
          </div>

          {/* Heading */}
          <div className="mb-6 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {isSignup ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {isSignup
                ? 'Enter your email to get started — no password needed'
                : 'Enter your email to receive a magic sign-in link'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={sendMagicLink} noValidate className="space-y-5" aria-live="polite">
            {magicLinkSent ? (
              <div className="space-y-4" role="status">
                <div className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 text-sm dark:border-neutral-600 dark:bg-neutral-800/60">
                  <p className="leading-relaxed">
                    We sent a {isSignup ? 'sign-up' : 'sign-in'} link to{' '}
                    <strong>{normalizedEmail()}</strong>. Open it on this device or enter the
                    one-time code below.
                  </p>
                </div>
                {devInbox && (
                  <a
                    href={`/inbox?email=${encodeURIComponent(normalizedEmail())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-sm shadow-sm transition-all hover:shadow-md hover:from-blue-100 hover:to-indigo-100 dark:border-blue-700 dark:from-blue-900/40 dark:to-indigo-900/40 dark:hover:from-blue-900/60 dark:hover:to-indigo-900/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                      <FontAwesomeIcon icon={faInbox} />
                    </span>
                    <span className="flex-1">
                      <strong className="block text-blue-900 dark:text-blue-100">
                        Open Dev Inbox
                      </strong>
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        No SMTP configured — view email for {normalizedEmail()}
                      </span>
                    </span>
                    <span className="text-blue-400 dark:text-blue-500">&rarr;</span>
                  </a>
                )}
                <div className="space-y-3 text-sm">
                  <label className="block space-y-1">
                    <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      One-time code
                    </span>
                    <Input
                      value={tokenValue}
                      onChange={(e) => setTokenValue(e.target.value)}
                      placeholder="123456"
                      disabled={loggingInToken}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="w-full"
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={loginWithToken}
                      disabled={!tokenValue || loggingInToken}
                      className="flex-1 bg-blue-600 py-3 text-sm text-white hover:bg-blue-500 disabled:opacity-40 md:text-base"
                    >
                      {loggingInToken ? 'Signing in…' : isSignup ? 'Create account' : 'Sign in'}
                    </Button>
                    <Button
                      type="button"
                      disabled={sendingLink}
                      onClick={(e) => {
                        e.preventDefault();
                        if (sendingLink) return;
                        setJustResent(true);
                        sendMagicLink(e);
                      }}
                      className="flex-1 bg-neutral-200 py-3 text-sm text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 md:text-base"
                    >
                      {sendingLink ? 'Resending…' : justResent ? 'Sent!' : 'Resend'}
                    </Button>
                  </div>
                  {tokenError && (
                    <div
                      role="alert"
                      className="text-xs font-medium text-red-600 dark:text-red-400"
                    >
                      {tokenError}
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={() => {
                      setMagicLinkSent(false);
                      setSendingLink(false);
                      setTokenValue('');
                      setTokenError(null);
                    }}
                    className="w-full bg-transparent p-0 text-xs font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                  >
                    Use a different email
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <label className="block space-y-1 text-sm">
                  <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    Email address
                  </span>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    spellCheck={false}
                    placeholder="you@example.com"
                    disabled={sendingLink}
                    className="w-full"
                  />
                </label>
                {linkError && (
                  <div role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                    {linkError}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={!email || sendingLink}
                  className="w-full bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:opacity-40"
                >
                  {sendingLink ? 'Sending…' : isSignup ? 'Get started' : 'Send magic link'}
                </Button>
                <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                  {isSignup
                    ? "We'll email you a secure link to create your account. No password needed."
                    : "We'll email you a secure one-time sign-in link. No password to remember."}
                </p>
              </>
            )}
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
            <span className="text-xs text-neutral-400 dark:text-neutral-500">or</span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
          </div>

          {/* Mode toggle CTA */}
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
