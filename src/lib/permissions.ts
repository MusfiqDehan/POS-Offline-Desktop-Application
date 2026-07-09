import type { SessionKind } from "./auth-session";
import type { TenantAccessPayload } from "./access";

export type AppTier = "owner" | "manager";

export function deriveAccessTier(
  sessionKind: SessionKind | null,
  tenantAccess: TenantAccessPayload | null,
): AppTier | null {
  if (!sessionKind) return null;
  if (!tenantAccess) return "manager";
  if (tenantAccess.is_tenant_admin || tenantAccess.role_slugs.includes("admin")) {
    return "owner";
  }
  return "manager";
}

export type PermissionLevel = "none" | "view" | "edit" | "full";

const LEVEL_HIERARCHY: Record<PermissionLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
  full: 3,
};

export function hasPermission(
  permissions: Record<string, string>,
  featureKey: string,
  requiredLevel: PermissionLevel = "view",
  isTenantAdmin = false,
): boolean {
  if (isTenantAdmin) return true;
  const actual = (permissions[featureKey] ?? "none") as PermissionLevel;
  return LEVEL_HIERARCHY[actual] >= LEVEL_HIERARCHY[requiredLevel];
}
