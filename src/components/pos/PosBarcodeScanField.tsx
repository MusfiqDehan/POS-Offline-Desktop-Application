import { useCallback, useState } from "react";
import { ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POS_BARCODE_INPUT_ID } from "@/lib/posBarcodeWedge";

type Props = {
  onBarcodeScan: (code: string) => void;
};

export function PosBarcodeScanField({ onBarcodeScan }: Props) {
  const [value, setValue] = useState("");

  const submit = useCallback(() => {
    const code = value.trim();
    if (!code) return;
    onBarcodeScan(code);
    setValue("");
  }, [value, onBarcodeScan]);

  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <ScanSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={POS_BARCODE_INPUT_ID}
          className="pl-9"
          placeholder="Scan or type barcode…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <Button type="button" onClick={submit} disabled={!value.trim()}>
        Scan
      </Button>
    </div>
  );
}
