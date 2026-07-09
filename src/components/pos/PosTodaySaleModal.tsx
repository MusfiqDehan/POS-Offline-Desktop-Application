import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAccessToken } from "@/lib/auth-session";
import { fetchPosTodaySummary } from "@/lib/pos-api";
import type { PosTodaySummary } from "@/lib/pos-types";
import { useActiveBranch } from "@/providers/branch-provider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PosTodaySaleModal({ open, onOpenChange }: Props) {
  const { activeBranch } = useActiveBranch();
  const [summary, setSummary] = useState<PosTodaySummary | null>(null);

  useEffect(() => {
    if (!open || !activeBranch) return;
    void (async () => {
      const res = await fetchPosTodaySummary(activeBranch.id, getAccessToken());
      if (res.ok && res.body.data) setSummary(res.body.data);
    })();
  }, [open, activeBranch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Today&apos;s sale</DialogTitle>
        </DialogHeader>
        {summary ? (
          <div className="space-y-2 text-sm">
            <p>Date: {summary.date}</p>
            <p>Total sales: {summary.total_sales}</p>
            <p>Transactions: {summary.transaction_count}</p>
            <p>Items sold: {summary.items_sold}</p>
            <p>Avg order: {summary.avg_order_value}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No summary available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
