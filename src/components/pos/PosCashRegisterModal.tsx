import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAccessToken } from "@/lib/auth-session";
import {
  fetchCashRegisterStatus,
  openCashRegisterShift,
  recordCashRegisterMovement,
} from "@/lib/pos-api";
import type { CashRegisterStatus } from "@/lib/pos-types";
import { useActiveBranch } from "@/providers/branch-provider";
import { useSync } from "@/providers/sync-provider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PosCashRegisterModal({ open, onOpenChange }: Props) {
  const { activeBranch } = useActiveBranch();
  const { online } = useSync();
  const [status, setStatus] = useState<CashRegisterStatus | null>(null);
  const [openingFloat, setOpeningFloat] = useState("100");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open || !activeBranch || !online) return;
    void (async () => {
      const res = await fetchCashRegisterStatus(activeBranch.id, getAccessToken());
      if (res.ok && res.body.data) setStatus(res.body.data);
    })();
  }, [open, activeBranch, online]);

  const openShift = async () => {
    if (!activeBranch) return;
    if (!online) {
      setMessage("Cash register open requires internet in v1 queue path via sync later.");
      return;
    }
    const res = await openCashRegisterShift(
      { branch: activeBranch.id, opening_float: openingFloat },
      getAccessToken(),
    );
    if (res.ok && res.body.data) {
      setStatus(res.body.data);
      setMessage("Shift opened");
    } else {
      setMessage(res.body.message ?? "Failed to open shift");
    }
  };

  const recordMovement = async (movement_type: "cash_in" | "cash_out") => {
    if (!activeBranch || !amount) return;
    if (!online) {
      setMessage("Cash movements require connectivity (queued offline supported in SyncEngine Outbox).");
      return;
    }
    const res = await recordCashRegisterMovement(
      { branch: activeBranch.id, movement_type, amount },
      getAccessToken(),
    );
    if (res.ok && res.body.data) {
      setStatus(res.body.data);
      setAmount("");
      setMessage(`${movement_type} recorded`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cash register</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {status ? (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p>Status: {status.is_open ? "Open" : "Closed"}</p>
              <p>Balance: {status.balance}</p>
              <p>Cash sales today: {status.cash_sales_today}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {online ? "Loading register status…" : "Offline — open register when online."}
            </p>
          )}

          {!status?.is_open && (
            <div className="space-y-2">
              <Label>Opening float</Label>
              <Input value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} />
              <Button onClick={() => void openShift()}>Open shift</Button>
            </div>
          )}

          {status?.is_open && (
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void recordMovement("cash_in")}>
                  Cash in
                </Button>
                <Button variant="outline" onClick={() => void recordMovement("cash_out")}>
                  Cash out
                </Button>
              </div>
            </div>
          )}

          {message && <p className="text-sm text-secondary">{message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
