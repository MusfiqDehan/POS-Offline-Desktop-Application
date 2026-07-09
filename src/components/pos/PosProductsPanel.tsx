import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryTab } from "@/hooks/usePosCategories";
import { apiRowToPosProduct, type PosProduct } from "@/lib/posProductMapping";
import type { PosProductRow } from "@/lib/pos-types";
import { formatCurrency, parseCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Props = {
  categories: CategoryTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  products: PosProductRow[];
  productsLoading: boolean;
  cartProductIds: Set<string>;
  onProductSelect: (product: PosProduct) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
};

export function PosProductsPanel({
  categories,
  activeTab,
  onTabChange,
  products,
  productsLoading,
  cartProductIds,
  onProductSelect,
  searchQuery,
  onSearchChange,
}: Props) {
  const display = products.map(apiRowToPosProduct);

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <div className="space-y-3 border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search products or SKU"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="h-auto w-full flex-wrap justify-start bg-transparent p-0">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="mb-1">
                {cat.name}
                <span className="ml-1 opacity-70">({cat.count})</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {productsLoading ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : display.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {display.map((product) => {
              const selected = cartProductIds.has(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onProductSelect(product)}
                  className={cn(
                    "rounded-lg border bg-card p-3 text-left transition hover:ring-2 hover:ring-primary",
                    selected && "border-primary bg-primary-100 ring-1 ring-primary",
                    product.stockStatus === "out-of-stock" && "opacity-60",
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-secondary">
                      {product.name}
                    </p>
                    <Badge
                      variant={
                        product.stockStatus === "in-stock"
                          ? "success"
                          : product.stockStatus === "low-stock"
                            ? "default"
                            : "outline"
                      }
                    >
                      {product.stockStatus === "out-of-stock" ? "Out" : product.stockLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                  <p className="mt-2 text-base font-bold text-primary">
                    {formatCurrency(parseCurrency(product.price))}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
