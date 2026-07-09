import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getActiveBranchId, setActiveBranchId as persistBranchId } from "@/lib/app-store";
import { getAccessToken } from "@/lib/auth-session";
import { fetchAllTenantBranches, fetchBranches, type Branch } from "@/lib/branches";
import { useAuth } from "@/providers/auth-provider";

export type BranchContextValue = {
  branches: Branch[];
  activeBranch: Branch | null;
  setActiveBranchId: (id: string) => void;
  loading: boolean;
  canSwitchBranch: boolean;
  refreshBranches: () => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { tier } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  const canSwitchBranch = tier === "owner";

  const reloadBranches = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let result =
      tier === "owner"
        ? await fetchAllTenantBranches(token)
        : await fetchBranches(token);

    if ((!result.ok || !result.body.success) && tier === "owner") {
      result = await fetchBranches(token);
    }

    if (result.ok && result.body.success && result.body.data) {
      const list = result.body.data;
      setBranches(list);
      const storedId = await getActiveBranchId();
      const branch =
        (storedId ? list.find((b) => b.id === storedId) : null) ?? list[0] ?? null;
      setActiveBranch(branch);
      if (branch) await persistBranchId(branch.id);
    }
    setLoading(false);
  }, [tier]);

  useEffect(() => {
    void reloadBranches();
  }, [reloadBranches]);

  const setActiveBranchId = useCallback(
    (id: string) => {
      if (!canSwitchBranch) return;
      const branch = branches.find((b) => b.id === id);
      if (branch) {
        setActiveBranch(branch);
        void persistBranchId(id);
      }
    },
    [branches, canSwitchBranch],
  );

  const value = useMemo(
    () => ({
      branches,
      activeBranch,
      setActiveBranchId,
      loading,
      canSwitchBranch,
      refreshBranches: () => void reloadBranches(),
    }),
    [branches, activeBranch, setActiveBranchId, loading, canSwitchBranch, reloadBranches],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useActiveBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useActiveBranch must be used within BranchProvider");
  return ctx;
}
