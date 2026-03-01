/**
 * router — Minimal client-side routing primitives.
 *
 * Extracted into its own module so any component can consume RouterContext
 * without creating circular dependencies with AppLayout.
 */
import { createContext, useContext } from 'react';

export interface RouterCtx {
  pathname: string;
  navigate: (path: string) => void;
}

export const RouterContext = createContext<RouterCtx>({
  pathname: '/app',
  navigate: () => {},
});

export const useRouter = () => useContext(RouterContext);
