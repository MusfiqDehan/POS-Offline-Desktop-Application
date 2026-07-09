import favicon from "@/assets/brand/favicon.png";
import { CloudOff, LogOut, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/providers/auth-provider";
import { useActiveBranch } from "@/providers/branch-provider";
import { useSync } from "@/providers/sync-provider";
import { Badge } from "@/components/ui/badge";

type Props = {
  onOpenCashRegister: () => void;
  onOpenTodaySale: () => void;
};

export function PosHeader({ onOpenCashRegister, onOpenTodaySale }: Props) {
  const { logout } = useAuth();
  const { branches, activeBranch, setActiveBranchId, canSwitchBranch } = useActiveBranch();
  const { online, syncing, pullNow } = useSync();

  return (
    <header className="mb-3 flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <img src={favicon} alt="Sortorium" className="h-9 w-9 rounded-md" />
        <div>
          <p className="text-sm font-bold text-secondary">Sortorium POS</p>
          <div className="flex items-center gap-2">
            {online ? (
              <Badge variant="success">Online</Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <CloudOff className="h-3 w-3" /> Offline
              </Badge>
            )}
            {syncing && <span className="text-xs text-muted-foreground">Syncing…</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canSwitchBranch && branches.length > 0 ? (
          <Select
            value={activeBranch?.id}
            onValueChange={(id) => setActiveBranchId(id)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-secondary">{activeBranch?.name ?? "No branch"}</span>
        )}

        <Button variant="outline" size="sm" onClick={onOpenCashRegister}>
          <Wallet className="h-4 w-4" /> Cash register
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenTodaySale}>
          Today sale
        </Button>
        <Button variant="outline" size="icon" onClick={() => void pullNow()} disabled={!online}>
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
