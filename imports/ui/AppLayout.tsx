/**
 * AppLayout — Root shell for all authenticated app routes.
 *
 * Composes three primitives:
 *   • Sidebar     — collapsible, icon-only or full width, drawer on mobile
 *   • AppHeader   — sticky top bar with title, theme toggle, user menu
 *   • <main>      — scrollable content area
 *
 * RouterContext is the single source of truth for pathname so any descendant
 * can read the current route or navigate without prop-drilling or an external
 * router library.
 *
 * SidebarContext owns expand/collapse + mobile drawer state.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { ChatApp } from '../features/chat/ChatApp';
import { PollsApp } from '../features/polls/PollsApp';
import { ProfilePage } from '../features/profile/ProfilePage';
import { TodosApp } from '../features/todos/TodosApp';
import { AppHeader } from './AppHeader';
import { RouterContext } from './router';
import { SettingsPage } from './SettingsPage';
import { Sidebar } from './Sidebar';

// ─── Router ───────────────────────────────────────────────────────────────────
// RouterCtx, RouterContext and useRouter are defined in ./router.ts
// Re-exported here so existing imports from AppLayout continue to work.
export type { RouterCtx } from './router';
export { RouterContext, useRouter } from './router';

// ─── Route registry ───────────────────────────────────────────────────────────

interface RouteConfig {
  title: string;
  component: React.FC;
}

const ROUTES: Record<string, RouteConfig> = {
  // Feature routes — to remove a feature, delete its folder and remove its entry here
  '/app/todos': { title: 'Todos', component: TodosApp },
  '/app/chat': { title: 'Chat', component: ChatApp },
  '/app/polls': { title: 'Polls', component: PollsApp },
  '/app/settings': { title: 'Settings', component: SettingsPage },
};

function match(pathname: string): RouteConfig | null {
  if (pathname.startsWith('/app/profile/')) return null; // handled separately
  return ROUTES[pathname] ?? ROUTES['/app/todos'];
}

// ─── Context ─────────────────────────────────────────────────────────────────

export interface SidebarCtx {
  isExpanded: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

export const SidebarContext = createContext<SidebarCtx>({
  isExpanded: true,
  isMobileOpen: false,
  toggle: () => {},
  openMobile: () => {},
  closeMobile: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

// ─── AppLayout ────────────────────────────────────────────────────────────────

const SIDEBAR_KEY = 'app:sidebar';

export const AppLayout: React.FC = () => {
  // ── Routing ──
  // Normalize legacy /app root to /app/todos so the sidebar item is always active
  const normalizePath = (p: string) => (p === '/app' ? '/app/todos' : p);

  const [pathname, setPathname] = useState(() => {
    if (typeof window === 'undefined') return '/app/todos';
    const p = window.location.pathname;
    if (p === '/app') window.history.replaceState(null, '', '/app/todos');
    return normalizePath(p);
  });

  const navigate = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    setPathname(path);
  }, []);

  // Keep in sync with browser back/forward
  useEffect(() => {
    const onPop = () => setPathname(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // '/app/profile/:userId' is a parameterized route — resolved outside ROUTES
  const profileUserId = pathname.startsWith('/app/profile/')
    ? pathname.slice('/app/profile/'.length)
    : null;

  const route = profileUserId ? null : match(pathname);
  const pageTitle = profileUserId ? 'Profile' : (route?.title ?? 'App');

  // ── Sidebar ──
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(SIDEBAR_KEY) !== 'collapsed';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? 'expanded' : 'collapsed');
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setIsMobileOpen(false);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      <SidebarContext.Provider
        value={{ isExpanded, isMobileOpen, toggle, openMobile, closeMobile }}
      >
        <div className="flex h-screen overflow-hidden bg-neutral-50 font-sans text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
          {/* Mobile backdrop — tap to close drawer */}
          {isMobileOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={closeMobile}
              aria-hidden
            />
          )}

          <Sidebar />

          {/* Content column */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <AppHeader title={pageTitle} />
            <main className="flex-1 overflow-auto">
              {profileUserId ? (
                <ProfilePage userId={profileUserId} />
              ) : (
                route && React.createElement(route.component)
              )}
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </RouterContext.Provider>
  );
};
