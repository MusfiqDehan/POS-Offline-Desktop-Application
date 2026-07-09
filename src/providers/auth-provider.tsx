import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchTenantPermissions,
  type TenantAccessPayload,
  type TenantAccessResponse,
} from "@/lib/access";
import {
  clearSession,
  getAccessToken,
  getSessionKind,
  type SessionKind,
} from "@/lib/auth-session";
import { deriveAccessTier, type AppTier } from "@/lib/permissions";
import { getStoredSubdomain } from "@/lib/app-store";
import { setTenantSubdomain } from "@/lib/tenant-headers";

export type AuthContextValue = {
  loading: boolean;
  sessionKind: SessionKind | null;
  tier: AppTier | null;
  tenantAccess: TenantAccessPayload | null;
  refreshAccess: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toTenantAccess(data: TenantAccessResponse): TenantAccessPayload {
  return {
    role_slugs: data.role_slugs ?? [],
    is_tenant_admin: Boolean(data.is_tenant_admin),
    permissions: data.permissions ?? {},
    enabled_features: data.enabled_features ?? [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [sessionKind, setSessionKind] = useState<SessionKind | null>(null);
  const [tenantAccess, setTenantAccess] = useState<TenantAccessPayload | null>(null);

  const resetAuth = useCallback(() => {
    setSessionKind(null);
    setTenantAccess(null);
  }, []);

  const refreshAccess = useCallback(async () => {
    const token = getAccessToken();
    const kind = getSessionKind();
    const subdomain = await getStoredSubdomain();
    if (subdomain) setTenantSubdomain(subdomain);

    if (!token || !kind) {
      resetAuth();
      setLoading(false);
      return;
    }

    setLoading(true);
    setSessionKind(kind);

    if (!navigator.onLine) {
      // Offline tolerance: keep sessionKind, leave cached access if present
      setLoading(false);
      return;
    }

    const result = await fetchTenantPermissions(token);
    if (result.ok && result.body.success && result.body.data) {
      setTenantAccess(toTenantAccess(result.body.data));
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [resetAuth]);

  useEffect(() => {
    void refreshAccess();
  }, [refreshAccess]);

  const logout = useCallback(() => {
    clearSession();
    resetAuth();
  }, [resetAuth]);

  const tier = deriveAccessTier(sessionKind, tenantAccess);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      sessionKind,
      tier,
      tenantAccess,
      refreshAccess,
      logout,
    }),
    [loading, sessionKind, tier, tenantAccess, refreshAccess, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
