import { apiGet, type ApiResult } from "./api";

export const TENANT_ACCESS_ME_PATH = "access/me/";

export type TenantAccessPayload = {
  role_slugs: string[];
  is_tenant_admin: boolean;
  permissions: Record<string, string>;
  enabled_features: string[];
};

export type TenantAccessResponse = TenantAccessPayload & {
  user_id?: string;
  email?: string;
  full_name?: string;
};

export function fetchTenantPermissions(
  accessToken: string,
): Promise<ApiResult<TenantAccessResponse>> {
  return apiGet<TenantAccessResponse>(TENANT_ACCESS_ME_PATH, accessToken);
}
