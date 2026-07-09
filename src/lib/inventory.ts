import { apiDelete, apiGet, apiPatch, apiPost, type ApiResult } from "./api";

export type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export type CreateCategoryPayload = {
  name: string;
  slug?: string;
  is_active?: boolean;
};

const CATEGORIES_PATH = "inventory/categories/";

export async function fetchCategories(
  accessToken?: string,
): Promise<ApiResult<Category[]>> {
  return apiGet<Category[]>(CATEGORIES_PATH, accessToken);
}

export async function createCategory(
  payload: CreateCategoryPayload,
  accessToken?: string,
): Promise<ApiResult<Category>> {
  return apiPost<Category>(CATEGORIES_PATH, payload, accessToken);
}

export async function updateCategory(
  id: string,
  payload: Partial<CreateCategoryPayload>,
  accessToken?: string,
): Promise<ApiResult<Category>> {
  return apiPatch<Category>(`${CATEGORIES_PATH}${id}/`, payload, accessToken);
}

export async function deleteCategory(
  id: string,
  accessToken?: string,
): Promise<ApiResult<Category>> {
  return apiDelete<Category>(`${CATEGORIES_PATH}${id}/`, accessToken);
}
