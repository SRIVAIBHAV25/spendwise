/**
 * Live storage query hook. Re-runs whenever the transaction store revision
 * changes, which is how every dashboard total, chart and calendar cell stays
 * in sync after an add, edit or delete.
 */
import { useCallback, useEffect, useState } from 'react';

import { toUserMessage } from '@/lib/errors';
import { useTransactionsStore } from '@/lib/stores/transactions';

export interface DbQueryResult<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * @param run Memoized loader (wrap it in `useCallback`).
 * @param initial Value shown until the first result arrives.
 */
export function useDbQuery<T>(run: () => Promise<T>, initial: T): DbQueryResult<T> {
  const revision = useTransactionsStore((state) => state.revision);
  const isReady = useTransactionsStore((state) => state.status === 'ready');
  const [data, setData] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!isReady) return undefined;
    let cancelled = false;
    setIsLoading(true);
    run()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(toUserMessage(cause, 'Could not load your expenses.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [run, revision, isReady, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, isLoading, error, reload };
}
