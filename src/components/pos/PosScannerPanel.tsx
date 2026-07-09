import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  onBarcodeScan: (code: string) => void;
};

export function PosScannerPanel({ onBarcodeScan }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focus = () => ref.current?.focus();
    focus();
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, []);

  return (
    <Input
      ref={ref}
      aria-label="Barcode scanner"
      className="sr-only"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const value = e.currentTarget.value.trim();
          if (value) {
            onBarcodeScan(value);
            e.currentTarget.value = "";
          }
        }
      }}
    />
  );
}
