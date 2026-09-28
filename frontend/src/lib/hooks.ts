"use client";

import { useCallback, useEffect, useState } from "react";

import { api, type Page } from "@/lib/api";
import { useAuth } from "@/stores/auth";

/** Refetch key parts: wait for auth, and refetch when the user changes. */
function useAuthKey(): string | null {
  const ready = useAuth((s) => s.ready);
  const userId = useAuth((s) => s.user?.id ?? "");
  return ready ? userId : null;
}

// Shared so "no items yet" is the same array every render (safe as an effect dependency).
const NO_ITEMS: never[] = [];

function message(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

/**
 * Load a single resource. Re-fetches when the path or the logged-in user changes,
 * and waits for auth so per-user fields (liked, followed) come back correct.
 */
export function useResource<T>(path: string | null) {
  const authKey = useAuthKey();
  const [version, setVersion] = useState(0);
  const key = authKey !== null && path ? `${path}|${authKey}|${version}` : null;
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null }>();

  useEffect(() => {
    if (!key || !path) return;
    let cancelled = false;
    api.get<T>(path).then(
      (data) => !cancelled && setResult({ key, data, error: null }),
      (e) => !cancelled && setResult({ key, data: null, error: message(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [key, path]);

  const setData = useCallback(
    (data: T) => setResult((prev) => ({ key: prev?.key ?? "", data, error: null })),
    [],
  );

  return {
    data: result?.data ?? null,
    setData,
    error: result?.error ?? null,
    loading: result?.key !== key,
    reload: () => setVersion((v) => v + 1),
  };
}

/** Offset-paginated list with "load more". */
export function usePaged<T>(path: string | null, pageSize = 20) {
  const authKey = useAuthKey();
  const [version, setVersion] = useState(0);
  const key = authKey !== null && path ? `${path}|${authKey}|${version}` : null;
  const [state, setState] = useState<{
    key: string;
    items: T[];
    hasMore: boolean;
    error: string | null;
  }>();
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    (offset: number) => {
      const sep = path!.includes("?") ? "&" : "?";
      return api.get<Page<T>>(`${path}${sep}limit=${pageSize}&offset=${offset}`);
    },
    [path, pageSize],
  );

  useEffect(() => {
    if (!key || !path) return;
    let cancelled = false;
    fetchPage(0).then(
      (page) => !cancelled && setState({ key, items: page.items, hasMore: page.has_more, error: null }),
      (e) => !cancelled && setState({ key, items: [], hasMore: false, error: message(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [key, path, fetchPage]);

  const items: T[] = state?.items ?? NO_ITEMS;

  async function loadMore() {
    if (!state) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(items.length);
      setState({ ...state, items: [...items, ...page.items], hasMore: page.has_more });
    } catch (e) {
      setState({ ...state, error: message(e) });
    } finally {
      setLoadingMore(false);
    }
  }

  return {
    items,
    setItems: (next: T[]) => state && setState({ ...state, items: next }),
    hasMore: state?.hasMore ?? false,
    loading: state?.key !== key || loadingMore,
    error: state?.error ?? null,
    loadMore,
    reload: () => setVersion((v) => v + 1),
  };
}
