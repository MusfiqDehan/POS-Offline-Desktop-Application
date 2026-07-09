import { beforeEach, describe, expect, it } from "vitest";
import { MemoryPosRepository } from "@/lib/db/memory-repository";
import { setPosRepositoryForTests } from "@/lib/db";
import type { CheckoutPayload, PosProductRow } from "@/lib/pos-types";
import { setTenantSubdomain } from "@/lib/tenant-headers";
import { hasPermission } from "@/lib/permissions";

describe("outbox enqueue and replay", () => {
  let repo: MemoryPosRepository;

  beforeEach(() => {
    repo = new MemoryPosRepository();
    setPosRepositoryForTests(repo);
    setTenantSubdomain("demo");
  });

  it("preserves idempotency_key when enqueueing offline checkout", async () => {
    const payload: CheckoutPayload = {
      branch: "branch-1",
      lines: [{ product: "p1", quantity: 1 }],
      payments: [{ method: "cash", amount: "10.00" }],
      idempotency_key: "idem-123",
    };

    const row = await repo.enqueueCheckout("demo", "branch-1", "idem-123", payload);
    expect(row.idempotency_key).toBe("idem-123");
    expect(row.status).toBe("pending");

    const pending = await repo.listPendingCheckout("demo");
    expect(pending).toHaveLength(1);
    expect(JSON.parse(pending[0].payload_json).idempotency_key).toBe("idem-123");
  });

  it("replays outbox FIFO and marks synced", async () => {
    await repo.enqueueCheckout("demo", "b1", "a", {
      branch: "b1",
      lines: [],
      payments: [],
      idempotency_key: "a",
    });
    await repo.enqueueCheckout("demo", "b1", "b", {
      branch: "b1",
      lines: [],
      payments: [],
      idempotency_key: "b",
    });

    const pending = await repo.listPendingCheckout("demo");
    expect(pending.map((p) => p.idempotency_key)).toEqual(["a", "b"]);

    await repo.updateCheckoutStatus(pending[0].id, "synced");
    const remaining = await repo.listPendingCheckout("demo");
    expect(remaining).toHaveLength(1);
    expect(remaining[0].idempotency_key).toBe("b");
  });

  it("marks failed outbox with error", async () => {
    const row = await repo.enqueueCheckout("demo", "b1", "x", {
      branch: "b1",
      lines: [],
      payments: [],
      idempotency_key: "x",
    });
    await repo.updateCheckoutStatus(row.id, "failed", "Insufficient stock");
    const pending = await repo.listPendingCheckout("demo");
    expect(pending).toHaveLength(0);
    expect(repo.checkoutOutbox[0].status).toBe("failed");
    expect(repo.checkoutOutbox[0].error).toBe("Insufficient stock");
  });
});

describe("offline barcode lookup", () => {
  let repo: MemoryPosRepository;

  beforeEach(async () => {
    repo = new MemoryPosRepository();
    setPosRepositoryForTests(repo);
    setTenantSubdomain("demo");
    const product: PosProductRow = {
      id: "prod-1",
      name: "Notebook",
      sku: "NB-001",
      barcode: "1234567890",
      price: "25.00",
      available_stock: "10",
      category_id: "cat-1",
      category_name: "Stationery",
      image: "",
      tax_type: "exclusive",
      unit_name: "pc",
      selling_type: "retail",
      entity_type: "product",
      variant_id: null,
      package_id: null,
      unit_quantity: 1,
    };
    await repo.upsertProducts("demo", "branch-1", [product]);
  });

  it("finds product by barcode offline", async () => {
    const found = await repo.findProductByCode("demo", "branch-1", "1234567890");
    expect(found?.name).toBe("Notebook");
  });

  it("finds product by sku offline", async () => {
    const found = await repo.findProductByCode("demo", "branch-1", "NB-001");
    expect(found?.id).toBe("prod-1");
  });

  it("returns null for unknown code", async () => {
    const found = await repo.findProductByCode("demo", "branch-1", "missing");
    expect(found).toBeNull();
  });
});

describe("permissions and login helpers", () => {
  it("hasPermission grants tenant admin", () => {
    expect(hasPermission({}, "pos", "edit", true)).toBe(true);
    expect(hasPermission({ pos: "view" }, "pos", "edit", false)).toBe(false);
    expect(hasPermission({ pos: "edit" }, "pos", "edit", false)).toBe(true);
  });
});
