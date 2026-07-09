import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "@/lib/inventory";
import { getAccessToken } from "@/lib/auth-session";
import { useSync } from "@/providers/sync-provider";
import type { CategoryTab } from "@/hooks/usePosCategories";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryTab[];
  onCreated: () => void;
};

/** Online-only category create (offline: modal shows unavailable message). */
export function PosManageCategoriesModal({
  open,
  onOpenChange,
  categories,
  onCreated,
}: Props) {
  const { online } = useSync();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!online) {
      setMessage("Category management requires an internet connection.");
      return;
    }
    if (!name.trim()) return;
    setLoading(true);
    try {
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const res = await createCategory(
        { name: name.trim(), slug, is_active: true },
        getAccessToken(),
      );
      if (!res.ok) {
        setMessage(res.body.message ?? "Failed to create category");
        return;
      }
      setName("");
      setMessage("Category created — sync to refresh tabs");
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
        </DialogHeader>
        {!online ? (
          <p className="text-sm text-muted-foreground">
            Category management is unavailable offline. Reconnect to create or edit categories.
          </p>
        ) : (
          <form className="space-y-3" onSubmit={(e) => void handleCreate(e)}>
            <div className="space-y-2">
              <Label htmlFor="cat-name">New category name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving…" : "Create category"}
            </Button>
          </form>
        )}
        <div className="max-h-40 space-y-1 overflow-y-auto text-sm">
          {categories
            .filter((c) => c.id !== "all")
            .map((c) => (
              <div key={c.id} className="flex justify-between border-b border-border py-1">
                <span>{c.name}</span>
                <span className="text-muted-foreground">{c.count}</span>
              </div>
            ))}
        </div>
        {message && <p className="text-sm text-secondary">{message}</p>}
      </DialogContent>
    </Dialog>
  );
}
