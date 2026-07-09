import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReceiptSnapshot } from "@/hooks/usePosCart";
import { formatCurrency } from "@/lib/currency";

export function PosCheckoutDialog({
  open,
  onOpenChange,
  totalPayable,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPayable: number;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm payment</DialogTitle>
        </DialogHeader>
        <p className="text-sm">
          Charge <strong className="text-primary">{formatCurrency(totalPayable)}</strong>?
        </p>
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              await onConfirm();
              onOpenChange(false);
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Processing…" : "Complete sale"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function PosReceiptDialog({
  open,
  onOpenChange,
  receipt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptSnapshot | null;
}) {
  return (
    <Dialog open={open && Boolean(receipt)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sale complete</DialogTitle>
        </DialogHeader>
        {receipt && (
          <div className="space-y-3 text-sm">
            <p>Invoice: {receipt.invoiceId}</p>
            <p>Payment: {receipt.paymentLabel}</p>
            <p className="text-lg font-bold text-primary">
              Total: {formatCurrency(receipt.totalPayable)}
            </p>
            <Button className="w-full" onClick={() => window.print()}>
              Print receipt
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
