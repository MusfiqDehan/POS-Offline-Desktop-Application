import { extractListItems } from "@/lib/api";
import type { PaymentMethod } from "@/lib/pos-types";

export type PaymentMethodsLoadInput = {
  online: boolean;
  apiOk: boolean;
  apiData: unknown;
  cachedMethods: PaymentMethod[];
};

export type PaymentMethodsLoadResult = {
  methods: PaymentMethod[];
  source: "api" | "cache" | "empty";
  shouldPersist: boolean;
};

function isActive(method: PaymentMethod): boolean {
  return method.is_active !== false;
}

/**
 * Resolve which payment methods to show: prefer a non-empty online API list,
 * otherwise fall back to the local cache. Used by usePosCart so online failures
 * do not leave the sidebar empty when cache already has methods.
 */
export function resolvePaymentMethodsLoad(
  input: PaymentMethodsLoadInput,
): PaymentMethodsLoadResult {
  if (input.online && input.apiOk) {
    const fromApi = extractListItems<PaymentMethod>(input.apiData).filter(isActive);
    if (fromApi.length > 0) {
      return { methods: fromApi, source: "api", shouldPersist: true };
    }
  }

  const fromCache = input.cachedMethods.filter(isActive);
  if (fromCache.length > 0) {
    return { methods: fromCache, source: "cache", shouldPersist: false };
  }

  return { methods: [], source: "empty", shouldPersist: false };
}
