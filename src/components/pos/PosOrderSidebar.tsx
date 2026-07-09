import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentMethod, PosCustomer } from "@/lib/pos-types";
import { formatCurrency } from "@/lib/currency";
import { resolveProductImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

function isResolvableIcon(icon: string | null | undefined): icon is string {
  if (!icon || !icon.trim()) return false;
  const trimmed = icon.trim();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/media/") ||
    trimmed.startsWith("/")
  );
}

type Props = {
  invoiceId: string;
  customers: PosCustomer[];
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string | null) => void;
  paymentMethods: PaymentMethod[];
  selectedPaymentId: string | null;
  onSelectPayment: (id: string) => void;
  subtotal: number;
  tax: number;
  totalPayable: number;
  canCheckout: boolean;
  onHold: () => void;
  onNew: () => void;
  onClear: () => void;
  onPay: () => void;
  onCreateCustomer: () => void;
  heldOrders?: Array<{ id: string; label: string }>;
  onRecallHeld?: (id: string) => void;
  onManageCategories?: () => void;
};

export function PosOrderSidebar({
  invoiceId,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  paymentMethods,
  selectedPaymentId,
  onSelectPayment,
  subtotal,
  tax,
  totalPayable,
  canCheckout,
  onHold,
  onNew,
  onClear,
  onPay,
  onCreateCustomer,
  heldOrders = [],
  onRecallHeld,
  onManageCategories,
}: Props) {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <div className="space-y-4 border-b border-border p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</p>
            <p className="font-semibold text-secondary">{invoiceId}</p>
          </div>
          {onManageCategories && (
            <Button variant="ghost" size="sm" onClick={onManageCategories}>
              Categories
            </Button>
          )}
        </div>

        {heldOrders.length > 0 && onRecallHeld && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-secondary">Held orders</p>
            <div className="max-h-24 space-y-1 overflow-y-auto">
              {heldOrders.map((h) => (
                <Button
                  key={h.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onRecallHeld(h.id)}
                >
                  {h.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-secondary">Customer</p>
            <Button variant="ghost" size="sm" onClick={onCreateCustomer}>
              + New
            </Button>
          </div>
          <Select
            value={selectedCustomerId ?? "walk-in"}
            onValueChange={(v) => onSelectCustomer(v === "walk-in" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Walk-in customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">Walk-in customer</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-secondary">Payment</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <Button
                key={method.id}
                type="button"
                variant={selectedPaymentId === method.id ? "default" : "outline"}
                className={cn(
                  "h-auto gap-2 py-2",
                  selectedPaymentId === method.id && "bg-primary",
                )}
                onClick={() => onSelectPayment(method.id)}
              >
                {isResolvableIcon(method.icon) && (
                  <img
                    src={resolveProductImageUrl(method.icon)}
                    alt=""
                    className="h-4 w-4 object-contain"
                  />
                )}
                {method.label}
              </Button>
            ))}
            {paymentMethods.length === 0 && (
              <p className="col-span-2 text-xs text-muted-foreground">
                No payment methods synced yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 p-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sub Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-secondary">
            <span>Total Payable</span>
            <span className="text-primary">{formatCurrency(totalPayable)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={onHold}>
            Hold
          </Button>
          <Button variant="outline" onClick={onNew}>
            New
          </Button>
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        </div>
        <Button className="w-full" disabled={!canCheckout} onClick={onPay}>
          Pay & Print
        </Button>
      </div>
    </Card>
  );
}
