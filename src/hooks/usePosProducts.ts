import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth-session";
import { extractListItems } from "@/lib/api";
import { getPosRepository } from "@/lib/db";
import { fetchPosProducts, scanPosProduct } from "@/lib/pos-api";
import type { PosProductParams, PosProductRow } from "@/lib/pos-types";
import { getTenantSubdomain } from "@/lib/tenant-headers";
import { useActiveBranch } from "@/providers/branch-provider";
import { useSync } from "@/providers/sync-provider";

export function usePosProducts(categoryId: string, searchQuery: string) {
  const { activeBranch } = useActiveBranch();
  const { online } = useSync();
  const [products, setProducts] = useState<PosProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!activeBranch) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);
    const tenant = getTenantSubdomain();
    const repo = await getPosRepository();

    if (online) {
      const token = getAccessToken();
      const params: PosProductParams = { branch: activeBranch.id };
      if (categoryId && categoryId !== "all") params.category = categoryId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const result = await fetchPosProducts(params, token);
      if (result.ok && result.body.data) {
        const items = extractListItems<PosProductRow>(result.body.data);
        setProducts(items);
        if (tenant && items.length > 0) {
          await repo.upsertProducts(tenant, activeBranch.id, items);
        }
      } else {
        setError(result.body.message ?? "Failed to load products.");
        const cached = await repo.listProducts(
          tenant,
          activeBranch.id,
          categoryId === "all" ? undefined : categoryId,
          searchQuery,
        );
        setProducts(cached);
      }
    } else {
      const cached = await repo.listProducts(
        tenant,
        activeBranch.id,
        categoryId === "all" ? undefined : categoryId,
        searchQuery,
      );
      setProducts(cached);
    }

    setLoading(false);
  }, [activeBranch, categoryId, searchQuery, online]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const scanBarcode = useCallback(
    async (
      code: string,
    ): Promise<
      | { ok: true; row: PosProductRow }
      | { ok: false; message: string }
    > => {
      if (!activeBranch) {
        return { ok: false, message: "Select a branch before scanning." };
      }
      if (!code.trim()) {
        return { ok: false, message: "Enter a barcode or SKU to scan." };
      }

      const tenant = getTenantSubdomain();
      const repo = await getPosRepository();
      const trimmed = code.trim();

      if (online) {
        const token = getAccessToken();
        const result = await scanPosProduct(activeBranch.id, trimmed, token);
        if (result.ok && result.body.data) {
          const row = result.body.data as PosProductRow;
          if (tenant) {
            await repo.upsertProducts(tenant, activeBranch.id, [row]);
          }
          return { ok: true, row };
        }
        return {
          ok: false,
          message: result.body.message ?? "Product not found for this barcode.",
        };
      }

      const row = await repo.findProductByCode(tenant, activeBranch.id, trimmed);
      if (!row) {
        return { ok: false, message: "Product not found for this barcode." };
      }
      return { ok: true, row };
    },
    [activeBranch, online],
  );

  return { products, loading, error, scanBarcode, reload };
}
