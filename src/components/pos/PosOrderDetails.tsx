import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CartItem } from "@/hooks/usePosCart";
import { formatCurrency } from "@/lib/currency";

type Props = {
  items: CartItem[];
  onDecrease: (id: string) => void;
  onIncrease: (id: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
};

export function PosOrderDetails({
  items,
  onDecrease,
  onIncrease,
  onRemove,
  onClearAll,
}: Props) {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-lg font-semibold text-secondary">Order Details</h2>
        <Button variant="ghost" size="sm" onClick={onClearAll} disabled={items.length === 0}>
          Clear all
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cart is empty. Scan or select products.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-secondary">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.price)} · {item.sku}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" onClick={() => onDecrease(item.id)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <Button size="icon" variant="outline" onClick={() => onIncrease(item.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
