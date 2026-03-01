/**
 * useMethod — Typed wrapper around Meteor.call for React components.
 *
 * Eliminates raw Meteor.call usage and provides:
 *   • Type-safe method name + args (via generic)
 *   • Loading state
 *   • Error state (string, safe for display)
 *   • Callback-based API that fits React patterns
 *
 * Usage:
 *   const { call, loading, error } = useMethod('todos.insert');
 *   const handleAdd = () => call(text).then(() => setInput(''));
 */
import { Meteor } from 'meteor/meteor';
import { useCallback, useState } from 'react';

interface UseMethodReturn<TArgs extends unknown[], TResult = unknown> {
  call: (...args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * @param methodName — Meteor method name (e.g. 'todos.insert')
 */
export function useMethod<TArgs extends unknown[] = unknown[], TResult = unknown>(
  methodName: string,
): UseMethodReturn<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    (...args: TArgs): Promise<TResult> => {
      setLoading(true);
      setError(null);
      return new Promise<TResult>((resolve, reject) => {
        Meteor.call(methodName, ...args, (err: Meteor.Error | null, result: TResult) => {
          setLoading(false);
          if (err) {
            const message = err.reason || err.message || 'Something went wrong';
            setError(message);
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    },
    [methodName],
  );

  const clearError = useCallback(() => setError(null), []);

  return { call, loading, error, clearError };
}
