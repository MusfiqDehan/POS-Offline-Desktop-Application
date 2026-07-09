/** Branch API for tenant-scoped branch management. */

import { apiGet, type ApiResult } from "./api";

export const BRANCH_LIST_PATH = "branches/";

export type Branch = {
  id: string;
  name: string;
  code: string;
  is_headquarters?: boolean;
  is_active: boolean;
};

type PaginatedBody<T> = {
  results: T[];
};

export async function fetchBranches(
  accessToken?: string,
): Promise<ApiResult<Branch[]>> {
  const result = await apiGet<PaginatedBody<Branch> | Branch[]>(
    BRANCH_LIST_PATH,
    accessToken,
  );

  if (result.ok && result.body.success && result.body.data) {
    const d = result.body.data;
    if (Array.isArray(d)) {
      return { ...result, body: { ...result.body, data: d } };
    }
    if ((d as PaginatedBody<Branch>).results) {
      return {
        ...result,
        body: {
          ...result.body,
          data: (d as PaginatedBody<Branch>).results,
        },
      };
    }
    if ((d as Record<string, unknown>).items && Array.isArray((d as Record<string, unknown>).items)) {
      return {
        ...result,
        body: {
          ...result.body,
          data: (d as Record<string, unknown>).items as Branch[],
        },
      };
    }
  }

  return result as ApiResult<Branch[]>;
}

export async function fetchAllTenantBranches(
  accessToken?: string,
): Promise<ApiResult<Branch[]>> {
  const result = await apiGet<Array<{ id: string; name: string; code: string; status: string }>>(
    "branches/summary/",
    accessToken,
  );
  if (result.ok && result.body.success && result.body.data) {
    const arr = Array.isArray(result.body.data) ? result.body.data : [];
    return {
      ...result,
      body: {
        ...result.body,
        data: arr.map<Branch>((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          is_active: true,
        })),
      },
    };
  }
  return result as unknown as ApiResult<Branch[]>;
}
