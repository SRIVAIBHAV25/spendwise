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

interface RequestKey {
  run: () => Promise<unknown>;
  revision: number;
  isReady: boolean;
  nonce: number;
}

function sameRequest(a: RequestKey, b: RequestKey): boolean {
  return (
    a.run === b.run && a.revision === b.revision && a.isReady === b.isReady && a.nonce === b.nonce
  );
}

/**
 * @param run Memoized loader (wrap it in `useCallback`).
 * @param initial Value shown until the first result arrives.
 */
export function useDbQuery<T>(run: () => Promise<T>, initial: T): DbQueryResult<T> {
  const revision = useTransactionsStore((state) => state.revision);
  const isReady = useTransactionsStore((state) => state.status === 'ready');
  const [data, setData] = useState<T>(initial);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Bumps a request id whenever the loader, revision, readiness or an
  // explicit `reload()` change. Comparing it against `settledId` derives
  // `isLoading` during render instead of toggling a flag inside the effect.
  const key: RequestKey = { run, revision, isReady, nonce };
  const [request, setRequest] = useState(() => ({ key, id: 0 }));
  if (!sameRequest(request.key, key)) {
    setRequest({ key, id: request.id + 1 });
  }
  const [settledId, setSettledId] = useState(-1);
  const isLoading = settledId !== request.id;

  useEffect(() => {
    if (!isReady) return undefined;
    let cancelled = false;
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
        if (!cancelled) setSettledId(request.id);
      });
    return () => {
      cancelled = true;
    };
  }, [run, isReady, request.id]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, isLoading, error, reload };
}
