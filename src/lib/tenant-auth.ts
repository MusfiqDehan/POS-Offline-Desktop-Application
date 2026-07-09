import { publicApiPost, type ApiResult } from "./api";

export const TENANT_LOGIN_PATH = "tenancy/auth/login/";

export type TenantLoginResult = {
  access: string;
  refresh: string;
  tenant?: {
    name: string;
    schema_name: string;
    domain: string;
  };
};

export function tenantLogin(
  email: string,
  password: string,
  subdomain: string,
): Promise<ApiResult<TenantLoginResult>> {
  return publicApiPost<TenantLoginResult>(TENANT_LOGIN_PATH, {
    email,
    password,
    subdomain,
  });
}
