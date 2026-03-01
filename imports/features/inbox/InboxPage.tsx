/**
 * InboxPage — Dev inbox UI for reading captured emails.
 *
 * Accessible at /inbox?email=user@example.com without authentication.
 * When MAIL_URL is not configured, magic-link emails are intercepted by
 * the Email.hookSend in startup/server.ts and stored in the DevMails
 * collection. This page subscribes to that collection and renders the
 * emails in real time.
 */
import { faArrowLeft, faEnvelope, faInbox, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useState } from 'react';

import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { type DevMailDoc, DevMails } from './api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEmailParam(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('email')?.trim().toLowerCase() || '';
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Turn plain-text URLs into clickable anchor tags (escapes all other HTML). */
function linkifyText(text: string): string {
  const urlRx = /(https?:\/\/[^\s]+)/g;
  let result = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRx.exec(text)) !== null) {
    result += escapeHtml(text.slice(last, m.index));
    const href = escapeHtml(m[1]);
    result += `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline break-all dark:text-blue-400">${href}</a>`;
    last = m.index + m[0].length;
  }
  result += escapeHtml(text.slice(last));
  return result;
}

/** Strip dangerous HTML: remove <script>, <iframe>, <object>, <embed>, <style> tags and on* event attrs. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*\/?\s*(script|iframe|object|embed|style)\b[^>]*>/gi, '')
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');
}

// ─── MailCard ─────────────────────────────────────────────────────────────────

const MailCard: React.FC<{ mail: DevMailDoc }> = ({ mail }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
          <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {mail.subject}
            </p>
            <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
              {timeAgo(mail.sentAt)}
            </span>
          </div>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            From: {mail.from}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
          {mail.text ? (
            <pre
              className="whitespace-pre-wrap break-words text-sm text-neutral-700 dark:text-neutral-300"
              dangerouslySetInnerHTML={{ __html: linkifyText(mail.text) }}
            />
          ) : mail.html ? (
            <div
              className="max-w-none text-sm text-neutral-700 dark:text-neutral-300 [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(mail.html) }}
            />
          ) : (
            <p className="text-sm italic text-neutral-400">(empty body)</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── InboxPage ────────────────────────────────────────────────────────────────

interface InboxPageProps {
  initialEmail?: string;
}

export const InboxPage: React.FC<InboxPageProps> = ({ initialEmail }) => {
  const [email, setEmail] = useState(initialEmail || getEmailParam());
  const [inputValue, setInputValue] = useState(email);

  const { messages, isReady } = useTracker(() => {
    if (!email) return { messages: [] as DevMailDoc[], isReady: true };
    const handle = Meteor.subscribe('inbox.messages', email);
    return {
      messages: DevMails.find({ to: email }, { sort: { sentAt: -1 } }).fetch(),
      isReady: handle.ready(),
    };
  }, [email]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = inputValue.trim().toLowerCase();
    if (!normalized) return;
    setEmail(normalized);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('email', normalized);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const clearInbox = () => {
    if (!email) return;
    Meteor.call('inbox.clear', email);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-neutral-50 font-sans text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <a
            href="/app"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 shadow-sm transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            aria-label="Back to login"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </a>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faInbox} className="text-lg text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-bold">Dev Inbox</h1>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {/* Email lookup form */}
        <form onSubmit={handleLookup} className="mb-6 flex gap-2">
          <Input
            type="email"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter email to check inbox…"
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim()}
            className="shrink-0 bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-40"
          >
            Check
          </Button>
        </form>

        {email ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing messages for{' '}
                <strong className="text-neutral-700 dark:text-neutral-200">{email}</strong>
              </p>
              {messages.length > 0 && (
                <Button
                  type="button"
                  onClick={clearInbox}
                  className="text-xs text-red-600 hover:text-red-500 dark:text-red-400"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-1" />
                  Clear inbox
                </Button>
              )}
            </div>

            {!isReady ? (
              <div className="py-12 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 py-12 text-center dark:border-neutral-600">
                <FontAwesomeIcon
                  icon={faInbox}
                  className="mb-3 text-3xl text-neutral-300 dark:text-neutral-600"
                />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No messages yet</p>
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                  Try signing in at{' '}
                  <a href="/app" className="text-blue-600 underline dark:text-blue-400">
                    /app
                  </a>{' '}
                  — the magic link email will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((mail) => (
                  <MailCard key={mail._id} mail={mail} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-300 py-12 text-center dark:border-neutral-600">
            <FontAwesomeIcon
              icon={faInbox}
              className="mb-3 text-3xl text-neutral-300 dark:text-neutral-600"
            />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Enter an email address above to check the dev inbox
            </p>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              When SMTP is not configured, magic link emails are captured here.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200 px-4 py-3 text-center text-xs text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
        Dev inbox — emails auto-expire after 24 hours
      </footer>
    </div>
  );
};
