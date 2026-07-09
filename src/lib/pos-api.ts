import { apiDelete, apiGet, apiPatch, apiPost, extractListItems, type ApiResult } from "./api";
import type {
  CashRegisterStatus,
  CheckoutPayload,
  CreatePosCustomerPayload,
  PaymentMethod,
  PosCategoryCounts,
  PosConfig,
  PosCustomer,
  PosCustomerParams,
  PosProductParams,
  PosProductRow,
  PosTodaySummary,
  SaleResponse,
} from "./pos-types";

function buildQuery(params: Record<string, string | boolean | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== "") qs.set(key, String(val));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export type PaymentMethodParams = {
  search?: string;
  active?: boolean;
};

export type PosOrderParams = {
  branch?: string;
  status?: string;
  cursor?: string;
  page_size?: number;
};

export type PosOrder = {
  id: string;
  ref_number: string;
  status: string;
  total: string;
  created_at: string;
};

/* ── Products & catalog ───────────────────────────────────────────── */

export async function fetchPosTodaySummary(
  branchId: string,
  accessToken?: string,
): Promise<ApiResult<PosTodaySummary>> {
  const q = buildQuery({ branch: branchId });
  return apiGet<PosTodaySummary>(`pos/today-summary/${q}`, accessToken);
}

export async function fetchPosProducts(
  params: PosProductParams,
  accessToken?: string,
): Promise<ApiResult<PosProductRow[]>> {
  const q = buildQuery(params as Record<string, string | boolean | number | undefined>);
  return apiGet<PosProductRow[]>(`pos/products/${q}`, accessToken);
}

export async function fetchPosCategoryCounts(
  params: Pick<PosProductParams, "branch" | "selling_type" | "in_stock">,
  accessToken?: string,
): Promise<ApiResult<PosCategoryCounts>> {
  const q = buildQuery(params as Record<string, string | boolean | undefined>);
  return apiGet<PosCategoryCounts>(`pos/products/category-counts/${q}`, accessToken);
}

export async function scanPosProduct(
  branch: string,
  code: string,
  accessToken?: string,
): Promise<ApiResult<PosProductRow>> {
  const q = buildQuery({ branch, code });
  return apiGet<PosProductRow>(`pos/products/scan/${q}`, accessToken);
}

export async function fetchAllPosProducts(
  branchId: string,
  accessToken: string,
): Promise<PosProductRow[]> {
  const all: PosProductRow[] = [];
  let cursor: string | undefined;
  do {
    const res = await fetchPosProducts({ branch: branchId, cursor, page_size: 100 }, accessToken);
    if (!res.ok) break;
    const items = extractListItems<PosProductRow>(res.body.data);
    all.push(...items);
    cursor =
      res.body.data && typeof res.body.data === "object" && "pagination" in res.body.data
        ? (res.body.data as { pagination?: { next_cursor?: string } }).pagination?.next_cursor
        : undefined;
    if (!cursor || items.length === 0) break;
  } while (cursor);
  return all;
}

/* ── Cash register ────────────────────────────────────────────────── */

export async function fetchCashRegisterStatus(
  branchId: string,
  accessToken?: string,
): Promise<ApiResult<CashRegisterStatus>> {
  const q = buildQuery({ branch: branchId });
  return apiGet<CashRegisterStatus>(`pos/cash-register/${q}`, accessToken);
}

export async function openCashRegisterShift(
  payload: { branch: string; opening_float: string | number },
  accessToken?: string,
): Promise<ApiResult<CashRegisterStatus>> {
  return apiPost<CashRegisterStatus>("pos/cash-register/open/", payload, accessToken);
}

export async function recordCashRegisterMovement(
  payload: {
    branch: string;
    movement_type: "cash_in" | "cash_out";
    amount: string | number;
    note?: string;
  },
  accessToken?: string,
): Promise<ApiResult<CashRegisterStatus>> {
  return apiPost<CashRegisterStatus>("pos/cash-register/movements/", payload, accessToken);
}

/* ── Payment methods ──────────────────────────────────────────────── */

export async function fetchPaymentMethods(
  params?: PaymentMethodParams,
  accessToken?: string,
): Promise<ApiResult<PaymentMethod[]>> {
  const q = buildQuery((params ?? {}) as Record<string, string | boolean | undefined>);
  return apiGet<PaymentMethod[]>(`pos/payment-methods/${q}`, accessToken);
}

/* ── Config ───────────────────────────────────────────────────────── */

export async function fetchPosConfig(
  accessToken?: string,
  branchId?: string | null,
): Promise<ApiResult<PosConfig>> {
  const q = branchId ? `?branch=${encodeURIComponent(branchId)}` : "";
  return apiGet<PosConfig>(`pos/config/${q}`, accessToken);
}

export async function updatePosConfig(
  payload: Partial<PosConfig>,
  accessToken?: string,
  branchId?: string | null,
): Promise<ApiResult<PosConfig>> {
  const q = branchId ? `?branch=${encodeURIComponent(branchId)}` : "";
  return apiPatch<PosConfig>(`pos/config/${q}`, payload, accessToken);
}

/* ── Customers ────────────────────────────────────────────────────── */

export async function fetchPosCustomers(
  params?: PosCustomerParams,
  accessToken?: string,
): Promise<ApiResult<PosCustomer[]>> {
  const q = buildQuery((params ?? {}) as Record<string, string | boolean | number | undefined>);
  return apiGet<PosCustomer[]>(`pos/customers/${q}`, accessToken);
}

export async function createPosCustomer(
  payload: CreatePosCustomerPayload,
  accessToken?: string,
): Promise<ApiResult<PosCustomer>> {
  return apiPost<PosCustomer>("pos/customers/", payload, accessToken);
}

export async function updatePosCustomer(
  id: string,
  payload: Partial<CreatePosCustomerPayload>,
  accessToken?: string,
): Promise<ApiResult<PosCustomer>> {
  return apiPatch<PosCustomer>(`pos/customers/${id}/`, payload, accessToken);
}

export async function deletePosCustomer(
  id: string,
  accessToken?: string,
): Promise<ApiResult<unknown>> {
  return apiDelete<unknown>(`pos/customers/${id}/`, accessToken);
}

export async function fetchAllPosCustomers(
  branchId: string,
  accessToken: string,
): Promise<PosCustomer[]> {
  const all: PosCustomer[] = [];
  let cursor: string | undefined;
  do {
    const res = await fetchPosCustomers({ branch: branchId, cursor, page_size: 100 }, accessToken);
    if (!res.ok) break;
    const items = extractListItems<PosCustomer>(res.body.data);
    all.push(...items);
    cursor =
      res.body.data && typeof res.body.data === "object" && "pagination" in res.body.data
        ? (res.body.data as { pagination?: { next_cursor?: string } }).pagination?.next_cursor
        : undefined;
    if (!cursor || items.length === 0) break;
  } while (cursor);
  return all;
}

/* ── Cart, checkout, orders ───────────────────────────────────────── */

export async function validatePosCart(
  payload: { branch: string; lines: CheckoutPayload["lines"] },
  accessToken?: string,
): Promise<ApiResult<unknown>> {
  return apiPost<unknown>("pos/cart/validate/", payload, accessToken);
}

export async function posCheckout(
  payload: CheckoutPayload,
  accessToken?: string,
): Promise<ApiResult<SaleResponse>> {
  return apiPost<SaleResponse>("pos/checkout/", payload, accessToken);
}

export async function fetchPosOrders(
  params?: PosOrderParams,
  accessToken?: string,
): Promise<ApiResult<PosOrder[]>> {
  let path = "pos/orders/";
  if (params) {
    const qs = buildQuery(params as Record<string, string | boolean | number | undefined>);
    if (qs) path = `pos/orders/${qs}`;
  }
  return apiGet<PosOrder[]>(path, accessToken);
}

export async function fetchPosOrderDetail(
  id: string,
  accessToken?: string,
): Promise<ApiResult<SaleResponse>> {
  return apiGet<SaleResponse>(`pos/orders/${id}/`, accessToken);
}

export async function cancelPosOrder(
  id: string,
  accessToken?: string,
): Promise<ApiResult<unknown>> {
  return apiPost<unknown>(`pos/orders/${id}/?action=cancel`, {}, accessToken);
}
