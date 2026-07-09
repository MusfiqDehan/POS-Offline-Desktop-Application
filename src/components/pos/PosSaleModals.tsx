import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PosReceiptBody, printReceiptContent } from "@/components/pos/PosReceiptBody";
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
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (receiptRef.current && receipt) {
      printReceiptContent(receiptRef.current, receipt.invoiceId);
    }
  }, [receipt]);

  return (
    <Dialog open={open && Boolean(receipt)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        {receipt && (
          <div className="space-y-3">
            <div ref={receiptRef}>
              <PosReceiptBody snapshot={receipt} />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button className="flex-1" onClick={handlePrint}>
                Print
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
