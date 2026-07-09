import { useCallback, useEffect, useRef, useState } from "react";
import { POS_SCAN_MIN_LENGTH } from "@/lib/posBarcodeWedge";
import { formatSerialPortError } from "@/lib/posSerialScannerHelp";

/** Yumite YT-100 / Netum OEM in USB Virtual COM mode (see lsusb 0483:5740). */
const SCANNER_USB_FILTERS = [{ usbVendorId: 0x0483, usbProductId: 0x5740 }];
const SERIAL_BAUD_RATES = [9600, 115200, 38400] as const;

export type SerialScannerStatus =
  | "unsupported"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

type Options = {
  onScan: (code: string) => void;
};

export function usePosSerialScanner({ onScan }: Options) {
  const onScanRef = useRef(onScan);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortRef = useRef(false);
  const bufferRef = useRef("");

  const [status, setStatus] = useState<SerialScannerStatus>(() =>
    typeof navigator !== "undefined" && "serial" in navigator
      ? "disconnected"
      : "unsupported",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastReceived, setLastReceived] = useState<string | null>(null);

  onScanRef.current = onScan;

  const flushBuffer = useCallback(() => {
    const code = bufferRef.current.trim();
    bufferRef.current = "";
    if (code.length < POS_SCAN_MIN_LENGTH) {
      return;
    }
    setLastReceived(code);
    onScanRef.current(code);
  }, []);

  const readLoop = useCallback(
    async (port: SerialPort) => {
      const reader = port.readable?.getReader();
      if (!reader) {
        setStatus("error");
        setErrorMessage("Serial port has no readable stream.");
        return;
      }

      readerRef.current = reader;
      const decoder = new TextDecoder();

      try {
        while (!abortRef.current) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          if (!value) {
            continue;
          }

          const chunk = decoder.decode(value);
          for (const char of chunk) {
            if (char === "\r" || char === "\n") {
              flushBuffer();
            } else {
              bufferRef.current += char;
            }
          }
        }
      } catch (err) {
        if (!abortRef.current) {
          setStatus("error");
          setErrorMessage(
            err instanceof Error ? err.message : "Serial read failed.",
          );
        }
      } finally {
        reader.releaseLock();
        readerRef.current = null;
      }
    },
    [flushBuffer],
  );

  const disconnect = useCallback(async () => {
    abortRef.current = true;
    bufferRef.current = "";

    try {
      await readerRef.current?.cancel();
    } catch {
      // ignore
    }

    try {
      await portRef.current?.close();
    } catch {
      // ignore
    }

    portRef.current = null;
    abortRef.current = false;
    setStatus(
      typeof navigator !== "undefined" && "serial" in navigator
        ? "disconnected"
        : "unsupported",
    );
    setErrorMessage(null);
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.serial) {
      setStatus("unsupported");
      setErrorMessage("Web Serial API is not available in this environment.");
      return;
    }

    setStatus("connecting");
    setErrorMessage(null);
    abortRef.current = false;

    try {
      let port: SerialPort | null = null;

      const existingPorts = await navigator.serial.getPorts();
      if (existingPorts.length === 1) {
        port = existingPorts[0] ?? null;
      }

      if (!port) {
        port = await navigator.serial.requestPort({
          filters: SCANNER_USB_FILTERS,
        });
      }

      let opened = false;
      let lastOpenError: unknown;

      for (const baudRate of SERIAL_BAUD_RATES) {
        try {
          await port.open({ baudRate });
          opened = true;
          break;
        } catch (err) {
          lastOpenError = err;
        }
      }

      if (!opened) {
        throw lastOpenError instanceof Error
          ? lastOpenError
          : new Error("Could not open scanner serial port.");
      }

      portRef.current = port;
      setStatus("connected");
      setErrorMessage(null);
      void readLoop(port);
    } catch (err) {
      setStatus("error");
      setErrorMessage(formatSerialPortError(err));
    }
  }, [readLoop]);

  useEffect(() => {
    return () => {
      void disconnect();
    };
  }, [disconnect]);

  return {
    status,
    errorMessage,
    lastReceived,
    connect,
    disconnect,
    isSupported: status !== "unsupported",
  };
}
