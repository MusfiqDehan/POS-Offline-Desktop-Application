import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SyncEngine, type SyncProgress } from "@/lib/sync/sync-engine";
import { useActiveBranch } from "@/providers/branch-provider";

type SyncContextValue = {
  online: boolean;
  syncing: boolean;
  progress: SyncProgress | null;
  lastError: string | null;
  engine: SyncEngine;
  pullNow: () => Promise<void>;
  pushNow: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { activeBranch } = useActiveBranch();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const engine = useMemo(() => new SyncEngine(() => online), [online]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const pullNow = useCallback(async () => {
    if (!activeBranch || !online) return;
    setSyncing(true);
    setLastError(null);
    try {
      await engine.pullAll(activeBranch.id, setProgress);
      await engine.pushOutbox();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
      setProgress(null);
    }
  }, [activeBranch, engine, online]);

  const pushNow = useCallback(async () => {
    if (!online) return;
    await engine.pushOutbox();
  }, [engine, online]);

  useEffect(() => {
    if (online && activeBranch) {
      void pullNow();
    }
  }, [online, activeBranch?.id]);

  const value = useMemo(
    () => ({ online, syncing, progress, lastError, engine, pullNow, pushNow }),
    [online, syncing, progress, lastError, engine, pullNow, pushNow],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
