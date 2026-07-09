import { describe, expect, it } from "vitest";
import { resolvePaymentMethodsLoad } from "@/lib/paymentMethodsLoad";
import type { PaymentMethod } from "@/lib/pos-types";

function method(overrides: Partial<PaymentMethod> = {}): PaymentMethod {
  return {
    id: "pm-1",
    label: "Cash",
    code: "cash",
    gateway_slug: null,
    is_active: true,
    icon: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("resolvePaymentMethodsLoad", () => {
  it("uses API list when online fetch succeeds with methods", () => {
    const result = resolvePaymentMethodsLoad({
      online: true,
      apiOk: true,
      apiData: { items: [method({ id: "api-cash", label: "Cash" })] },
      cachedMethods: [method({ id: "cache-card", label: "Card", code: "card" })],
    });
    expect(result.source).toBe("api");
    expect(result.shouldPersist).toBe(true);
    expect(result.methods).toHaveLength(1);
    expect(result.methods[0].id).toBe("api-cash");
  });

  it("falls back to cache when API request fails", () => {
    const result = resolvePaymentMethodsLoad({
      online: true,
      apiOk: false,
      apiData: undefined,
      cachedMethods: [method({ id: "cache-cash" })],
    });
    expect(result.source).toBe("cache");
    expect(result.shouldPersist).toBe(false);
    expect(result.methods[0].id).toBe("cache-cash");
  });

  it("falls back to cache when API returns empty list", () => {
    const result = resolvePaymentMethodsLoad({
      online: true,
      apiOk: true,
      apiData: { items: [] },
      cachedMethods: [method({ id: "cache-cash" })],
    });
    expect(result.source).toBe("cache");
    expect(result.methods[0].id).toBe("cache-cash");
  });

  it("returns empty when API and cache have no active methods", () => {
    const result = resolvePaymentMethodsLoad({
      online: true,
      apiOk: true,
      apiData: { items: [] },
      cachedMethods: [method({ is_active: false })],
    });
    expect(result.source).toBe("empty");
    expect(result.methods).toEqual([]);
  });

  it("uses cache when offline", () => {
    const result = resolvePaymentMethodsLoad({
      online: false,
      apiOk: false,
      apiData: undefined,
      cachedMethods: [method({ id: "offline-cash" })],
    });
    expect(result.source).toBe("cache");
    expect(result.methods[0].id).toBe("offline-cash");
  });
});
