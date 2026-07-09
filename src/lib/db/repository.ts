import type {
  CategoryRow,
  CheckoutOutboxRow,
  CheckoutPayload,
  OutboxStatus,
  PosCustomer,
  PosProductRow,
} from "@/lib/pos-types";

export type HeldOrderRow = {
  id: string;
  branch_id: string;
  tenant_subdomain: string;
  label: string;
  payload_json: string;
  created_at: string;
};

export interface PosRepository {
  init(): Promise<void>;
  clearTenant(tenantSubdomain: string): Promise<void>;
  upsertProducts(
    tenantSubdomain: string,
    branchId: string,
    products: PosProductRow[],
  ): Promise<void>;
  listProducts(
    tenantSubdomain: string,
    branchId: string,
    categoryId?: string,
    search?: string,
  ): Promise<PosProductRow[]>;
  findProductByCode(
    tenantSubdomain: string,
    branchId: string,
    code: string,
  ): Promise<PosProductRow | null>;
  upsertCategories(
    tenantSubdomain: string,
    branchId: string,
    categories: CategoryRow[],
  ): Promise<void>;
  listCategories(tenantSubdomain: string, branchId: string): Promise<CategoryRow[]>;
  upsertCustomers(
    tenantSubdomain: string,
    branchId: string,
    customers: PosCustomer[],
  ): Promise<void>;
  listCustomers(tenantSubdomain: string, branchId: string): Promise<PosCustomer[]>;
  upsertPaymentMethods(
    tenantSubdomain: string,
    branchId: string,
    methods: unknown[],
  ): Promise<void>;
  listPaymentMethods(tenantSubdomain: string, branchId: string): Promise<unknown[]>;
  savePosConfig(tenantSubdomain: string, branchId: string, config: unknown): Promise<void>;
  getPosConfig(tenantSubdomain: string, branchId: string): Promise<unknown | null>;
  enqueueCheckout(
    tenantSubdomain: string,
    branchId: string,
    idempotencyKey: string,
    payload: CheckoutPayload,
  ): Promise<CheckoutOutboxRow>;
  listPendingCheckout(tenantSubdomain: string): Promise<CheckoutOutboxRow[]>;
  updateCheckoutStatus(id: string, status: OutboxStatus, error?: string): Promise<void>;
  saveHeldOrder(row: HeldOrderRow): Promise<void>;
  listHeldOrders(tenantSubdomain: string, branchId: string): Promise<HeldOrderRow[]>;
  deleteHeldOrder(id: string): Promise<void>;
  setSyncMeta(
    tenantSubdomain: string,
    branchId: string,
    entity: string,
    syncedAt: string,
  ): Promise<void>;
}
