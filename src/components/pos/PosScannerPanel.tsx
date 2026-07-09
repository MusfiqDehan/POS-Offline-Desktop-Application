import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  usePosSerialScanner,
  type SerialScannerStatus,
} from "@/hooks/usePosSerialScanner";

type Props = {
  onBarcodeScan: (code: string) => void;
};

function statusLabel(status: SerialScannerStatus): string {
  switch (status) {
    case "connected":
      return "Connected (USB serial)";
    case "connecting":
      return "Connecting…";
    case "disconnected":
      return "Not connected";
    case "unsupported":
      return "Serial API not available";
    case "error":
      return "Connection error";
    default:
      return status;
  }
}

function statusVariant(status: SerialScannerStatus): "success" | "outline" | "default" {
  if (status === "connected") return "success";
  if (status === "error") return "outline";
  return "default";
}

export function PosScannerPanel({ onBarcodeScan }: Props) {
  const scanner = usePosSerialScanner({ onScan: onBarcodeScan });

  return (
    <div
      className="mb-3 rounded-lg border border-border bg-card px-4 py-3"
      role="region"
      aria-label="Barcode scanner"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-secondary">Barcode scanner</strong>
            <Badge variant={statusVariant(scanner.status)}>
              {statusLabel(scanner.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Keyboard-wedge scanners work automatically. For USB serial (COM) mode
            (e.g. YT-100), click <strong>Connect USB Scanner</strong>. A hardware
            beep means the device read a barcode.
          </p>
          {scanner.lastReceived && (
            <p className="text-primary">
              Last scan received: <code>{scanner.lastReceived}</code>
            </p>
          )}
          {scanner.errorMessage && (
            <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              <strong>Connection error:</strong> {scanner.errorMessage}
            </div>
          )}
        </div>

        <div className="shrink-0">
          {scanner.status === "connected" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void scanner.disconnect()}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={!scanner.isSupported || scanner.status === "connecting"}
              onClick={() => void scanner.connect()}
            >
              Connect USB Scanner
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
