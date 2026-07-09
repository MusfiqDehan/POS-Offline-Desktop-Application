import { randomUUID } from "@/lib/uuid";
import type {
  CategoryRow,
  CheckoutOutboxRow,
  CheckoutPayload,
  OutboxStatus,
  PosCustomer,
  PosProductRow,
} from "@/lib/pos-types";
import type { HeldOrderRow, PosRepository } from "./repository";

export class MemoryPosRepository implements PosRepository {
  products = new Map<string, PosProductRow>();
  categories = new Map<string, CategoryRow>();
  customers = new Map<string, PosCustomer>();
  paymentMethods = new Map<string, unknown>();
  configs = new Map<string, unknown>();
  checkoutOutbox: CheckoutOutboxRow[] = [];
  heldOrders = new Map<string, HeldOrderRow>();

  async init(): Promise<void> {}

  async clearTenant(tenantSubdomain: string): Promise<void> {
    const prefix = `${tenantSubdomain}:`;
    for (const key of [...this.products.keys()]) {
      if (key.startsWith(prefix)) this.products.delete(key);
    }
    for (const key of [...this.categories.keys()]) {
      if (key.startsWith(prefix)) this.categories.delete(key);
    }
    for (const key of [...this.customers.keys()]) {
      if (key.startsWith(prefix)) this.customers.delete(key);
    }
    this.checkoutOutbox = this.checkoutOutbox.filter((r) => r.tenant_subdomain !== tenantSubdomain);
  }

  private productKey(tenant: string, branch: string, id: string) {
    return `${tenant}:${branch}:${id}`;
  }

  async upsertProducts(
    tenantSubdomain: string,
    branchId: string,
    products: PosProductRow[],
  ): Promise<void> {
    for (const p of products) {
      this.products.set(this.productKey(tenantSubdomain, branchId, p.id), p);
    }
  }

  async listProducts(
    tenantSubdomain: string,
    branchId: string,
    categoryId?: string,
    search?: string,
  ): Promise<PosProductRow[]> {
    const q = search?.trim().toLowerCase() ?? "";
    const prefix = `${tenantSubdomain}:${branchId}:`;
    return [...this.products.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, p]) => p)
      .filter((p) => {
        if (categoryId && categoryId !== "all" && p.category_id !== categoryId) return false;
        if (!q) return true;
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      });
  }

  async findProductByCode(
    tenantSubdomain: string,
    branchId: string,
    code: string,
  ): Promise<PosProductRow | null> {
    const normalized = code.trim().toLowerCase();
    if (!normalized) return null;
    const prefix = `${tenantSubdomain}:${branchId}:`;
    for (const [key, p] of this.products.entries()) {
      if (!key.startsWith(prefix)) continue;
      if (p.barcode.toLowerCase() === normalized || p.sku.toLowerCase() === normalized) {
        return p;
      }
    }
    return null;
  }

  async upsertCategories(
    tenantSubdomain: string,
    branchId: string,
    categories: CategoryRow[],
  ): Promise<void> {
    for (const c of categories) {
      this.categories.set(`${tenantSubdomain}:${branchId}:${c.id}`, c);
    }
  }

  async listCategories(tenantSubdomain: string, branchId: string): Promise<CategoryRow[]> {
    return [...this.categories.values()].filter(
      (c) => c.tenant_subdomain === tenantSubdomain && c.branch_id === branchId,
    );
  }

  async upsertCustomers(
    tenantSubdomain: string,
    branchId: string,
    customers: PosCustomer[],
  ): Promise<void> {
    for (const c of customers) {
      this.customers.set(`${tenantSubdomain}:${branchId}:${c.id}`, c);
    }
  }

  async listCustomers(tenantSubdomain: string, branchId: string): Promise<PosCustomer[]> {
    const prefix = `${tenantSubdomain}:${branchId}:`;
    return [...this.customers.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, c]) => c);
  }

  async upsertPaymentMethods(
    tenantSubdomain: string,
    branchId: string,
    methods: unknown[],
  ): Promise<void> {
    methods.forEach((m, i) => {
      this.paymentMethods.set(`${tenantSubdomain}:${branchId}:${i}`, m);
    });
  }

  async listPaymentMethods(tenantSubdomain: string, branchId: string): Promise<unknown[]> {
    return [...this.paymentMethods.entries()]
      .filter(([k]) => k.startsWith(`${tenantSubdomain}:${branchId}:`))
      .map(([, v]) => v);
  }

  async savePosConfig(tenantSubdomain: string, branchId: string, config: unknown): Promise<void> {
    this.configs.set(`${tenantSubdomain}:${branchId}`, config);
  }

  async getPosConfig(tenantSubdomain: string, branchId: string): Promise<unknown | null> {
    return this.configs.get(`${tenantSubdomain}:${branchId}`) ?? null;
  }

  async enqueueCheckout(
    tenantSubdomain: string,
    branchId: string,
    idempotencyKey: string,
    payload: CheckoutPayload,
  ): Promise<CheckoutOutboxRow> {
    const row: CheckoutOutboxRow = {
      id: randomUUID(),
      idempotency_key: idempotencyKey,
      branch_id: branchId,
      tenant_subdomain: tenantSubdomain,
      payload_json: JSON.stringify(payload),
      status: "pending",
      error: null,
      created_at: new Date().toISOString(),
    };
    this.checkoutOutbox.push(row);
    return row;
  }

  async listPendingCheckout(tenantSubdomain: string): Promise<CheckoutOutboxRow[]> {
    return this.checkoutOutbox
      .filter((r) => r.tenant_subdomain === tenantSubdomain && r.status === "pending")
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async updateCheckoutStatus(id: string, status: OutboxStatus, error?: string): Promise<void> {
    const row = this.checkoutOutbox.find((r) => r.id === id);
    if (row) {
      row.status = status;
      row.error = error ?? null;
    }
  }

  async saveHeldOrder(row: HeldOrderRow): Promise<void> {
    this.heldOrders.set(row.id, row);
  }

  async listHeldOrders(tenantSubdomain: string, branchId: string): Promise<HeldOrderRow[]> {
    return [...this.heldOrders.values()].filter(
      (r) => r.tenant_subdomain === tenantSubdomain && r.branch_id === branchId,
    );
  }

  async deleteHeldOrder(id: string): Promise<void> {
    this.heldOrders.delete(id);
  }

  async setSyncMeta(
    _tenantSubdomain: string,
    _branchId: string,
    _entity: string,
    _syncedAt: string,
  ): Promise<void> {}
}
