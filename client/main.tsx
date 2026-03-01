import './styles.css';
import '../imports/startup/client';

import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useEffect } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import { InboxPage } from '../imports/features/inbox/InboxPage';
import { AppLayout } from '../imports/ui/AppLayout';
import { LandingPage } from '../imports/ui/LandingPage';
import { LoginForm } from '../imports/ui/LoginForm';

// ─── App (client-side rendered, /app and all non-root routes) ─────────────────

const App: React.FC = () => {
  const user = useTracker(() => Meteor.user());
  const loggingIn = useTracker(() => Meteor.loggingIn());
  if (loggingIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Loading…</p>
      </div>
    );
  }
  if (!user) return <LoginForm />;
  return <AppLayout />;
};

// ─── LandingPageWithRedirect (hydrates SSR content) ───────────────────────────
//
// Keeps `LandingPage` isomorphic by placing all Meteor/client logic here.
// Responsibilities:
//   • Provides the same React tree the server rendered so React can
//     attach event listeners without re-rendering (true hydration).
//   • Redirects to /app when a user is already logged in or logs in via
//     the magic link token that accounts-passwordless reads from the URL hash.
//   • Displays a translucent overlay while the token exchange is in flight.

const LandingPageWithRedirect: React.FC = () => {
  const user = useTracker(() => Meteor.user());
  const loggingIn = useTracker(() => Meteor.loggingIn());

  useEffect(() => {
    if (user) window.location.replace('/app');
  }, [user]);

  return (
    <>
      <LandingPage />
      {loggingIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-neutral-950/80">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Signing in…</p>
        </div>
      )}
    </>
  );
};

// ─── Entry point ──────────────────────────────────────────────────────────────

Meteor.startup(() => {
  const el = document.getElementById('root');
  if (!el) return;

  if (window.location.pathname === '/') {
    // Hydrate the server-rendered landing page.
    // React attaches listeners without discarding the server HTML,
    // giving instant first contentful paint and zero layout shift.
    hydrateRoot(el, <LandingPageWithRedirect />);
  } else if (window.location.pathname === '/inbox') {
    // Dev inbox — no auth required, no SSR to hydrate.
    createRoot(el).render(<InboxPage />);
  } else if (window.location.pathname.startsWith('/app')) {
    // Hydrate the server-rendered LoginForm.
    // The SSR handler renders <LoginForm> for /app routes; after hydration
    // React can swap to <AppLayout> once the user logs in.
    hydrateRoot(el, <App />);
  } else {
    // Unknown routes — no SSR content to hydrate, mount fresh.
    createRoot(el).render(<App />);
  }
});
