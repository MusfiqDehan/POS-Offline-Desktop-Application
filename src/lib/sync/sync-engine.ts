import { getAccessToken } from "@/lib/auth-session";
import { getPosRepository } from "@/lib/db";
import {
  fetchAllPosCustomers,
  fetchAllPosProducts,
  fetchPaymentMethods,
  fetchPosCategoryCounts,
  fetchPosConfig,
  posCheckout,
  scanPosProduct,
} from "@/lib/pos-api";
import { extractListItems } from "@/lib/api";
import type { CheckoutPayload, PosProductRow } from "@/lib/pos-types";
import { getTenantSubdomain } from "@/lib/tenant-headers";
import { fetchCategories } from "@/lib/inventory";

export type SyncProgress = {
  phase: string;
  percent: number;
};

export class SyncEngine {
  constructor(private readonly isOnline: () => boolean) {}

  async pullAll(branchId: string, onProgress?: (p: SyncProgress) => void): Promise<void> {
    if (!this.isOnline()) return;
    const token = getAccessToken();
    const tenant = getTenantSubdomain();
    if (!token || !tenant) return;

    const repo = await getPosRepository();
    onProgress?.({ phase: "products", percent: 10 });
    const products = await fetchAllPosProducts(branchId, token);
    await repo.upsertProducts(tenant, branchId, products);

    onProgress?.({ phase: "customers", percent: 40 });
    const customers = await fetchAllPosCustomers(branchId, token);
    await repo.upsertCustomers(tenant, branchId, customers);

    onProgress?.({ phase: "categories", percent: 60 });
    const countsRes = await fetchPosCategoryCounts({ branch: branchId }, token);
    const categoriesRes = await fetchCategories(token);
    if (categoriesRes.ok && categoriesRes.body.data) {
      const counts = countsRes.ok && countsRes.body.data ? countsRes.body.data.by_category : {};
      const items = extractListItems<{ id: string; name: string; slug: string; is_active: boolean }>(
        categoriesRes.body.data,
      );
      await repo.upsertCategories(
        tenant,
        branchId,
        items
          .filter((c) => c.is_active)
          .map((c) => ({
            id: c.id,
            branch_id: branchId,
            tenant_subdomain: tenant,
            name: c.name,
            slug: c.slug,
            product_count: counts[c.id] ?? 0,
          })),
      );
    }

    onProgress?.({ phase: "payment_methods", percent: 75 });
    const methodsRes = await fetchPaymentMethods({ active: true }, token);
    if (methodsRes.ok && methodsRes.body.data) {
      const methods = extractListItems(methodsRes.body.data);
      await repo.upsertPaymentMethods(tenant, branchId, methods);
    }

    onProgress?.({ phase: "config", percent: 90 });
    const configRes = await fetchPosConfig(token, branchId);
    if (configRes.ok && configRes.body.data) {
      await repo.savePosConfig(tenant, branchId, configRes.body.data);
    }

    await repo.setSyncMeta(tenant, branchId, "all", new Date().toISOString());
    onProgress?.({ phase: "done", percent: 100 });
  }

  async pushOutbox(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline()) return { synced: 0, failed: 0 };
    const token = getAccessToken();
    const tenant = getTenantSubdomain();
    if (!token || !tenant) return { synced: 0, failed: 0 };

    const repo = await getPosRepository();
    const pending = await repo.listPendingCheckout(tenant);
    let synced = 0;
    let failed = 0;

    for (const row of pending) {
      const payload = JSON.parse(row.payload_json) as CheckoutPayload;
      const res = await posCheckout(payload, token);
      if (res.ok) {
        await repo.updateCheckoutStatus(row.id, "synced");
        synced += 1;
      } else {
        await repo.updateCheckoutStatus(row.id, "failed", res.body.message ?? "Sync failed");
        failed += 1;
      }
    }
    return { synced, failed };
  }

  async getProducts(
    branchId: string,
    categoryId?: string,
    search?: string,
  ): Promise<PosProductRow[]> {
    const tenant = getTenantSubdomain();
    const repo = await getPosRepository();
    return repo.listProducts(tenant, branchId, categoryId, search);
  }

  async scanProduct(branchId: string, code: string): Promise<PosProductRow | null> {
    const tenant = getTenantSubdomain();
    const repo = await getPosRepository();

    if (this.isOnline()) {
      const token = getAccessToken();
      if (token) {
        const res = await scanPosProduct(branchId, code, token);
        if (res.ok && res.body.data) {
          const row = res.body.data as PosProductRow;
          await repo.upsertProducts(tenant, branchId, [row]);
          return row;
        }
      }
    }

    return repo.findProductByCode(tenant, branchId, code);
  }

  async checkoutOffline(branchId: string, payload: CheckoutPayload) {
    const tenant = getTenantSubdomain();
    const repo = await getPosRepository();
    return repo.enqueueCheckout(tenant, branchId, payload.idempotency_key, payload);
  }

  async checkoutOnline(payload: CheckoutPayload) {
    const token = getAccessToken();
    return posCheckout(payload, token);
  }
}
