import { useAuth } from "@/providers/auth-provider";
import { hasPermission, type PermissionLevel } from "@/lib/permissions";

export function usePermission(
  featureKey: string,
  requiredLevel: PermissionLevel = "view",
): { allowed: boolean; loading: boolean } {
  const { loading, sessionKind, tenantAccess } = useAuth();

  if (loading) return { allowed: false, loading: true };
  if (!sessionKind || !tenantAccess) return { allowed: false, loading: false };

  return {
    allowed: hasPermission(
      tenantAccess.permissions,
      featureKey,
      requiredLevel,
      tenantAccess.is_tenant_admin,
    ),
    loading: false,
  };
}
