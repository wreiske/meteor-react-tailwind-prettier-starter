import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';

import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { SmallMuted } from './SmallMuted';
import { ThemeToggle } from './ThemeToggle';
import Tooltip from './Tooltip';

interface LoginFormProps {
  onLoggedIn?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = () => {
  const [email, setEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [tokenValue, setTokenValue] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [loggingInToken, setLoggingInToken] = useState(false);
  const [justResent, setJustResent] = useState(false);

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

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden px-4 py-12 font-sans text-neutral-800 dark:text-neutral-100">
      <header className="w-full max-w-sm px-2 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Todo Sample App
        </h1>
        <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          A minimal Meteor + React demo
        </p>
      </header>
      <Card className="w-full max-w-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-800/70">
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Passwordless magic link
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="View source on GitHub" placement="right" delay={140}>
              <a
                href="https://github.com/wreiske/meteor-react-tailwind-prettier-starter"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 shadow-sm transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <FontAwesomeIcon icon={faGithub} className="text-base" />
              </a>
            </Tooltip>
            <ThemeToggle />
          </div>
        </div>
        <form onSubmit={sendMagicLink} noValidate className="space-y-5" aria-live="polite">
          {magicLinkSent ? (
            <div className="space-y-4" role="status">
              <div className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 text-xs dark:border-neutral-600 dark:bg-neutral-800/60">
                <p className="leading-relaxed">
                  We sent a sign-in link to <strong>{normalizedEmail()}</strong>. Open it on this
                  device or enter the one-time code below.
                </p>
              </div>
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
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 py-3 text-sm md:text-base"
                  >
                    {loggingInToken ? 'Signing in…' : 'Sign in'}
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
                    className="flex-1 bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 py-3 text-sm md:text-base"
                  >
                    {sendingLink ? 'Resending…' : justResent ? 'Sent!' : 'Resend'}
                  </Button>
                </div>
                {tokenError && (
                  <div role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
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
                {sendingLink ? 'Sending…' : 'Send magic link'}
              </Button>
              <SmallMuted className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                We’ll email you a secure one-time sign-in link. No password to remember.
              </SmallMuted>
            </>
          )}
        </form>
      </Card>
    </div>
  );
};
