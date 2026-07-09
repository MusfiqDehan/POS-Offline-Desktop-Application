import Database from "@tauri-apps/plugin-sql";
import { MIGRATIONS_SQL } from "./migrations";
import type { PosRepository, HeldOrderRow } from "./repository";
import { MemoryPosRepository } from "./memory-repository";
import type {
  CategoryRow,
  CheckoutOutboxRow,
  CheckoutPayload,
  OutboxStatus,
  PosCustomer,
  PosProductRow,
} from "@/lib/pos-types";

let dbPromise: Promise<Database> | null = null;
let repository: PosRepository | null = null;

async function getDatabase(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:sortorium.db");
  }
  return dbPromise;
}

class SqlitePosRepository implements PosRepository {
  private ready = false;
  private memory = new MemoryPosRepository();

  async init(): Promise<void> {
    if (this.ready) return;
    const db = await getDatabase();
    for (const statement of MIGRATIONS_SQL.split(";")
      .map((s) => s.trim())
      .filter(Boolean)) {
      await db.execute(statement);
    }
    this.ready = true;
  }

  async clearTenant(tenantSubdomain: string): Promise<void> {
    const db = await getDatabase();
    const tables = [
      "products",
      "categories",
      "customers",
      "payment_methods",
      "pos_config",
      "cash_register_state",
      "held_orders",
      "checkout_outbox",
      "cash_register_outbox",
      "sync_meta",
    ];
    for (const table of tables) {
      await db.execute(`DELETE FROM ${table} WHERE tenant_subdomain = $1`, [tenantSubdomain]);
    }
    await this.memory.clearTenant(tenantSubdomain);
  }

  async upsertProducts(
    tenantSubdomain: string,
    branchId: string,
    products: PosProductRow[],
  ): Promise<void> {
    await this.memory.upsertProducts(tenantSubdomain, branchId, products);
    const db = await getDatabase();
    for (const p of products) {
      await db.execute(
        `INSERT INTO products (id, branch_id, tenant_subdomain, sku, barcode, name, price, stock_qty, category_id, payload_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT(id, branch_id, tenant_subdomain) DO UPDATE SET
           sku=excluded.sku, barcode=excluded.barcode, name=excluded.name, price=excluded.price,
           stock_qty=excluded.stock_qty, category_id=excluded.category_id, payload_json=excluded.payload_json`,
        [
          p.id,
          branchId,
          tenantSubdomain,
          p.sku,
          p.barcode,
          p.name,
          p.price,
          p.available_stock,
          p.category_id,
          JSON.stringify(p),
        ],
      );
    }
  }

  async listProducts(
    tenantSubdomain: string,
    branchId: string,
    categoryId?: string,
    search?: string,
  ): Promise<PosProductRow[]> {
    const db = await getDatabase();
    let sql = `SELECT payload_json FROM products WHERE tenant_subdomain = $1 AND branch_id = $2`;
    const params: unknown[] = [tenantSubdomain, branchId];
    if (categoryId && categoryId !== "all") {
      sql += ` AND category_id = $3`;
      params.push(categoryId);
    }
    const rows = await db.select<{ payload_json: string }[]>(sql, params);
    const products = rows.map((r) => JSON.parse(r.payload_json) as PosProductRow);
    const q = search?.trim().toLowerCase() ?? "";
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }

  async findProductByCode(
    tenantSubdomain: string,
    branchId: string,
    code: string,
  ): Promise<PosProductRow | null> {
    const normalized = code.trim().toLowerCase();
    if (!normalized) return null;
    const db = await getDatabase();
    const rows = await db.select<{ payload_json: string }[]>(
      `SELECT payload_json FROM products
       WHERE tenant_subdomain = $1 AND branch_id = $2
         AND (lower(barcode) = $3 OR lower(sku) = $3)
       LIMIT 1`,
      [tenantSubdomain, branchId, normalized],
    );
    if (!rows[0]) return null;
    return JSON.parse(rows[0].payload_json) as PosProductRow;
  }

  async upsertCategories(
    tenantSubdomain: string,
    branchId: string,
    categories: CategoryRow[],
  ): Promise<void> {
    await this.memory.upsertCategories(tenantSubdomain, branchId, categories);
    const db = await getDatabase();
    for (const c of categories) {
      await db.execute(
        `INSERT INTO categories (id, branch_id, tenant_subdomain, name, slug, product_count)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT(id, branch_id, tenant_subdomain) DO UPDATE SET
           name=excluded.name, slug=excluded.slug, product_count=excluded.product_count`,
        [c.id, branchId, tenantSubdomain, c.name, c.slug, c.product_count],
      );
    }
  }

  async listCategories(tenantSubdomain: string, branchId: string): Promise<CategoryRow[]> {
    const db = await getDatabase();
    return db.select(
      `SELECT id, branch_id, tenant_subdomain, name, slug, product_count
       FROM categories WHERE tenant_subdomain = $1 AND branch_id = $2`,
      [tenantSubdomain, branchId],
    );
  }

  async upsertCustomers(
    tenantSubdomain: string,
    branchId: string,
    customers: PosCustomer[],
  ): Promise<void> {
    await this.memory.upsertCustomers(tenantSubdomain, branchId, customers);
    const db = await getDatabase();
    for (const c of customers) {
      await db.execute(
        `INSERT INTO customers (id, branch_id, tenant_subdomain, name, phone, email, payload_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT(id, branch_id, tenant_subdomain) DO UPDATE SET
           name=excluded.name, phone=excluded.phone, email=excluded.email, payload_json=excluded.payload_json`,
        [c.id, branchId, tenantSubdomain, c.name, c.phone, c.email, JSON.stringify(c)],
      );
    }
  }

  async listCustomers(tenantSubdomain: string, branchId: string): Promise<PosCustomer[]> {
    const db = await getDatabase();
    const rows = await db.select<{ payload_json: string }[]>(
      `SELECT payload_json FROM customers WHERE tenant_subdomain = $1 AND branch_id = $2`,
      [tenantSubdomain, branchId],
    );
    return rows.map((r) => JSON.parse(r.payload_json) as PosCustomer);
  }

  async upsertPaymentMethods(
    tenantSubdomain: string,
    branchId: string,
    methods: unknown[],
  ): Promise<void> {
    await this.memory.upsertPaymentMethods(tenantSubdomain, branchId, methods);
    const db = await getDatabase();
    await db.execute(
      `DELETE FROM payment_methods WHERE tenant_subdomain = $1 AND branch_id = $2`,
      [tenantSubdomain, branchId],
    );
    for (const m of methods) {
      const method = m as { id: string; label?: string; is_active?: boolean };
      await db.execute(
        `INSERT INTO payment_methods (id, branch_id, tenant_subdomain, name, is_active, payload_json)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          method.id,
          branchId,
          tenantSubdomain,
          method.label ?? method.id,
          method.is_active === false ? 0 : 1,
          JSON.stringify(m),
        ],
      );
    }
  }

  async listPaymentMethods(tenantSubdomain: string, branchId: string): Promise<unknown[]> {
    const db = await getDatabase();
    const rows = await db.select<{ payload_json: string }[]>(
      `SELECT payload_json FROM payment_methods WHERE tenant_subdomain = $1 AND branch_id = $2`,
      [tenantSubdomain, branchId],
    );
    return rows.map((r) => JSON.parse(r.payload_json));
  }

  async savePosConfig(tenantSubdomain: string, branchId: string, config: unknown): Promise<void> {
    await this.memory.savePosConfig(tenantSubdomain, branchId, config);
    const db = await getDatabase();
    await db.execute(
      `INSERT INTO pos_config (branch_id, tenant_subdomain, payload_json, updated_at)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT(branch_id, tenant_subdomain) DO UPDATE SET
         payload_json=excluded.payload_json, updated_at=excluded.updated_at`,
      [branchId, tenantSubdomain, JSON.stringify(config), new Date().toISOString()],
    );
  }

  async getPosConfig(tenantSubdomain: string, branchId: string): Promise<unknown | null> {
    const db = await getDatabase();
    const rows = await db.select<{ payload_json: string }[]>(
      `SELECT payload_json FROM pos_config WHERE tenant_subdomain = $1 AND branch_id = $2 LIMIT 1`,
      [tenantSubdomain, branchId],
    );
    if (!rows[0]) return null;
    return JSON.parse(rows[0].payload_json);
  }

  async enqueueCheckout(
    tenantSubdomain: string,
    branchId: string,
    idempotencyKey: string,
    payload: CheckoutPayload,
  ): Promise<CheckoutOutboxRow> {
    const row = await this.memory.enqueueCheckout(
      tenantSubdomain,
      branchId,
      idempotencyKey,
      payload,
    );
    const db = await getDatabase();
    await db.execute(
      `INSERT INTO checkout_outbox (id, idempotency_key, branch_id, tenant_subdomain, payload_json, status, error, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        row.id,
        row.idempotency_key,
        row.branch_id,
        row.tenant_subdomain,
        row.payload_json,
        row.status,
        row.error,
        row.created_at,
      ],
    );
    return row;
  }

  async listPendingCheckout(tenantSubdomain: string): Promise<CheckoutOutboxRow[]> {
    const db = await getDatabase();
    return db.select(
      `SELECT * FROM checkout_outbox WHERE tenant_subdomain = $1 AND status = 'pending' ORDER BY created_at ASC`,
      [tenantSubdomain],
    );
  }

  async updateCheckoutStatus(id: string, status: OutboxStatus, error?: string): Promise<void> {
    await this.memory.updateCheckoutStatus(id, status, error);
    const db = await getDatabase();
    await db.execute(`UPDATE checkout_outbox SET status = $1, error = $2 WHERE id = $3`, [
      status,
      error ?? null,
      id,
    ]);
  }

  async saveHeldOrder(row: HeldOrderRow): Promise<void> {
    await this.memory.saveHeldOrder(row);
    const db = await getDatabase();
    await db.execute(
      `INSERT INTO held_orders (id, branch_id, tenant_subdomain, label, payload_json, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT(id) DO UPDATE SET label=excluded.label, payload_json=excluded.payload_json`,
      [row.id, row.branch_id, row.tenant_subdomain, row.label, row.payload_json, row.created_at],
    );
  }

  async listHeldOrders(tenantSubdomain: string, branchId: string): Promise<HeldOrderRow[]> {
    const db = await getDatabase();
    return db.select(
      `SELECT * FROM held_orders WHERE tenant_subdomain = $1 AND branch_id = $2 ORDER BY created_at DESC`,
      [tenantSubdomain, branchId],
    );
  }

  async deleteHeldOrder(id: string): Promise<void> {
    await this.memory.deleteHeldOrder(id);
    const db = await getDatabase();
    await db.execute(`DELETE FROM held_orders WHERE id = $1`, [id]);
  }

  async setSyncMeta(
    tenantSubdomain: string,
    branchId: string,
    entity: string,
    syncedAt: string,
  ): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      `INSERT INTO sync_meta (entity, branch_id, tenant_subdomain, last_synced_at)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT(entity, branch_id, tenant_subdomain) DO UPDATE SET last_synced_at=excluded.last_synced_at`,
      [entity, branchId, tenantSubdomain, syncedAt],
    );
  }
}

export async function getPosRepository(): Promise<PosRepository> {
  if (repository) return repository;
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  repository = isTauri ? new SqlitePosRepository() : new MemoryPosRepository();
  await repository.init();
  return repository;
}

export function setPosRepositoryForTests(repo: PosRepository): void {
  repository = repo;
}

export function resetPosRepositoryForTests(): void {
  repository = null;
}
