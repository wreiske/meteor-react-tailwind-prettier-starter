/**
 * SSR startup — server only.
 *
 * Uses Meteor's `server-render` package (`onPageLoad`) to:
 *   1. Render the isomorphic <LandingPage> to an HTML string on the server
 *      for the `/` route, giving crawlers and users full HTML on first byte.
 *   2. Inject SEO meta tags, Open Graph tags, and LD+JSON structured data.
 *   3. Inject a tiny inline <script> that initialises the colour theme
 *      (reading localStorage / prefers-color-scheme) before the first paint,
 *      eliminating any flash of wrong theme (FOWT).
 *   4. Serve a plain app shell (<div id="root">) for all other routes so the
 *      React client-side bundle can mount normally.
 *
 * The client counterpart (`client/main.tsx`) calls `hydrateRoot` for `/` and
 * `createRoot` for every other route, keeping SSR + hydration DRY.
 */
import { onPageLoad } from 'meteor/server-render';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { LandingPage } from '../ui/LandingPage';
import { LoginForm } from '../ui/LoginForm';

// ─── Static SEO content ───────────────────────────────────────────────────────

const PAGE_TITLE = 'Meteor + React 19 + Tailwind CSS 4 Starter';

const META_DESCRIPTION =
  'Production-ready full-stack React starter with Meteor 3.4, React 19, ' +
  'Tailwind CSS 4, TypeScript 5, passwordless magic link auth, real-time DDP, ' +
  'and server-side rendering with client hydration. Clone and ship.';

const REPO_URL = 'https://github.com/wreiske/meteor-react-tailwind-prettier-starter';

/** Schema.org structured data — helps search engines understand the software. */
const LD_JSON = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: PAGE_TITLE,
  description: META_DESCRIPTION,
  url: REPO_URL,
  codeRepository: REPO_URL,
  programmingLanguage: [
    { '@type': 'ComputerLanguage', name: 'TypeScript' },
    { '@type': 'ComputerLanguage', name: 'JavaScript' },
  ],
  runtimePlatform: 'Meteor 3.4',
  license: 'https://opensource.org/licenses/MIT',
  author: { '@type': 'Person', name: 'wreiske' },
  keywords: 'meteor,react,tailwindcss,typescript,starter,boilerplate,ssr,hydration',
});

/**
 * Inline theme-init script injected into <head>.
 *
 * Runs synchronously before any body content renders:
 *   • Reads `app:theme` from localStorage (persists user preference).
 *   • Falls back to `prefers-color-scheme` media query.
 *   • Sets `data-theme` on <html> and toggles the `dark` class.
 *
 * Because this runs before the browser paints the body, the correct theme
 * colours are applied from the very first frame — zero layout or colour shift.
 * The ThemeButton in LandingPage mirrors this logic client-side after hydration.
 */
const THEME_INIT_SCRIPT = `(function(){var t=localStorage.getItem('app:theme')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);if(t==='dark')document.documentElement.classList.add('dark');}())`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safe HTML-attribute escaping for meta tag content values (static strings). */
function esc(s: string) {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildHeadTags(extraTags = '') {
  const title = esc(PAGE_TITLE);
  const desc = esc(META_DESCRIPTION);
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${REPO_URL}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="robots" content="index,follow" />`,
    `<link rel="canonical" href="/" />`,
    `<script type="application/ld+json">${LD_JSON}</script>`,
    `<script>${THEME_INIT_SCRIPT}</script>`,
    extraTags,
  ].join('\n');
}

// ─── URL helper ───────────────────────────────────────────────────────────────

/**
 * Safely extract the pathname from `sink.request.url`.
 *
 * At runtime Meteor's server-render can pass the URL as a plain string
 * ("/path?q=1") OR as a WHATWG URL object (which lacks `.split()`).
 * The `@types/meteor` declaration says `string | undefined`; trust the
 * runtime instead.
 */
interface ParsedUrl {
  pathname: string;
  query: Record<string, string>;
}

function extractUrl(rawUrl: unknown): ParsedUrl {
  const fallback: ParsedUrl = { pathname: '/', query: {} };
  if (rawUrl == null) return fallback;
  // Meteor 3.5+ passes a parsed URL-like object with pathname + query
  if (typeof rawUrl === 'object' && rawUrl !== null && 'pathname' in rawUrl) {
    const obj = rawUrl as { pathname?: string; query?: Record<string, string> };
    return {
      pathname: obj.pathname || '/',
      query: (obj.query && typeof obj.query === 'object' ? obj.query : {}) as Record<
        string,
        string
      >,
    };
  }
  if (rawUrl instanceof URL) {
    const q: Record<string, string> = {};
    rawUrl.searchParams.forEach((v, k) => {
      q[k] = v;
    });
    return { pathname: rawUrl.pathname, query: q };
  }
  if (typeof rawUrl === 'string') {
    try {
      const u = new URL(rawUrl, 'http://localhost');
      const q: Record<string, string> = {};
      u.searchParams.forEach((v, k) => {
        q[k] = v;
      });
      return { pathname: u.pathname, query: q };
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// ─── onPageLoad ───────────────────────────────────────────────────────────────

onPageLoad((sink) => {
  const req = (sink as unknown as { request?: { url?: unknown } }).request;
  const { pathname, query } = extractUrl(req?.url);

  if (pathname === '/') {
    // ── Landing page: full SSR ──────────────────────────────────────────────
    try {
      const html = renderToString(<LandingPage />);
      sink.appendToHead(buildHeadTags());
      sink.appendToBody(`<div id="root">${html}</div>`);
    } catch (err) {
      console.error('[SSR] Landing page renderToString failed:', err);
      sink.appendToHead(
        [`<title>${esc(PAGE_TITLE)}</title>`, `<script>${THEME_INIT_SCRIPT}</script>`].join('\n'),
      );
      sink.appendToBody('<div id="root"></div>');
    }
  } else if (pathname.startsWith('/app')) {
    // ── App routes: SSR the login form ─────────────────────────────────────
    // Unauthenticated visitors see the LoginForm. Authenticated users
    // will be swapped to AppLayout after hydration on the client.
    const mode = query.mode === 'signup' ? 'signup' : 'login';
    try {
      const html = renderToString(<LoginForm initialMode={mode} />);
      sink.appendToHead(
        buildHeadTags(mode === 'signup' ? '<meta name="robots" content="index,follow" />' : ''),
      );
      sink.appendToBody(`<div id="root">${html}</div>`);
    } catch (err) {
      console.error('[SSR] LoginForm renderToString failed:', err);
      sink.appendToHead(
        [`<title>${esc(PAGE_TITLE)}</title>`, `<script>${THEME_INIT_SCRIPT}</script>`].join('\n'),
      );
      sink.appendToBody('<div id="root"></div>');
    }
  } else {
    // ── Unknown routes: plain shell ────────────────────────────────────────
    sink.appendToHead(
      [`<title>${esc(PAGE_TITLE)}</title>`, `<script>${THEME_INIT_SCRIPT}</script>`].join('\n'),
    );
    sink.appendToBody('<div id="root"></div>');
  }
});
