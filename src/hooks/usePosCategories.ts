import { useCallback, useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@/lib/auth-session";
import { extractListItems } from "@/lib/api";
import { getPosRepository } from "@/lib/db";
import { fetchCategories } from "@/lib/inventory";
import { fetchPosCategoryCounts } from "@/lib/pos-api";
import { getTenantSubdomain } from "@/lib/tenant-headers";
import { useActiveBranch } from "@/providers/branch-provider";
import { useSync } from "@/providers/sync-provider";

export type CategoryTab = {
  id: string;
  name: string;
  count: number;
};

const EMPTY_COUNTS = { total: 0, by_category: {} as Record<string, number> };

export function usePosCategories(activeTab: string, onTabChange: (id: string) => void) {
  const { activeBranch } = useActiveBranch();
  const { online } = useSync();
  const [categories, setCategories] = useState<CategoryTab[]>([
    { id: "all", name: "All Categories", count: 0 },
  ]);

  const refresh = useCallback(async () => {
    if (!activeBranch) return;

    const tenant = getTenantSubdomain();
    const repo = await getPosRepository();
    const token = getAccessToken();

    if (online && token) {
      const [categoriesRes, countsRes] = await Promise.all([
        fetchCategories(token),
        fetchPosCategoryCounts({ branch: activeBranch.id }, token),
      ]);

      const counts =
        countsRes.ok && countsRes.body.data ? countsRes.body.data : EMPTY_COUNTS;
      const rawCategories =
        categoriesRes.ok && categoriesRes.body.data
          ? extractListItems<{ id: string; name: string; slug: string; is_active: boolean }>(
              categoriesRes.body.data,
            )
          : [];

      const activeCategories = rawCategories.filter((c) => c.is_active);
      const tabs: CategoryTab[] = [
        { id: "all", name: "All Categories", count: counts.total },
        ...activeCategories.map((c) => ({
          id: c.id,
          name: c.name,
          count: counts.by_category[c.id] ?? 0,
        })),
      ];
      setCategories(tabs);

      if (tenant) {
        await repo.upsertCategories(
          tenant,
          activeBranch.id,
          activeCategories.map((c) => ({
            id: c.id,
            branch_id: activeBranch.id,
            tenant_subdomain: tenant,
            name: c.name,
            slug: c.slug,
            product_count: counts.by_category[c.id] ?? 0,
          })),
        );
      }

      if (!tabs.find((t) => t.id === activeTab) && activeTab !== "all") {
        onTabChange("all");
      }
      return;
    }

    const rows = await repo.listCategories(tenant, activeBranch.id);
    const total = rows.reduce((sum, r) => sum + r.product_count, 0);
    setCategories([
      { id: "all", name: "All Categories", count: total },
      ...rows.map((r) => ({ id: r.id, name: r.name, count: r.product_count })),
    ]);
    if (!rows.find((r) => r.id === activeTab) && activeTab !== "all") {
      onTabChange("all");
    }
  }, [activeBranch, activeTab, onTabChange, online]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const categoryStats = useMemo(
    () => ({
      totalCategories: categories.filter((c) => c.id !== "all").length,
      totalProducts: categories.find((c) => c.id === "all")?.count ?? 0,
    }),
    [categories],
  );

  return { categories, categoryStats, refresh };
}
