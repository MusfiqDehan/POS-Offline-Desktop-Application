import { describe, expect, it } from "vitest";
import {
  isRapidWedgeInput,
  isScanTerminatorKey,
  shouldResetWedgeBuffer,
  POS_SCAN_MIN_LENGTH,
} from "@/lib/posBarcodeWedge";
import { formatSerialPortError } from "@/lib/posSerialScannerHelp";
import {
  scanAddedMessage,
  scanNotFoundMessage,
  SCAN_SOUND_URLS,
} from "@/lib/posScanFeedback";

describe("posBarcodeWedge helpers", () => {
  it("detects terminator keys", () => {
    expect(isScanTerminatorKey({ key: "Enter", keyCode: 13 } as KeyboardEvent)).toBe(
      true,
    );
    expect(isScanTerminatorKey({ key: "a", keyCode: 65 } as KeyboardEvent)).toBe(
      false,
    );
  });

  it("detects rapid wedge input", () => {
    expect(isRapidWedgeInput(200, POS_SCAN_MIN_LENGTH)).toBe(true);
    expect(isRapidWedgeInput(2000, POS_SCAN_MIN_LENGTH)).toBe(false);
  });

  it("resets buffer after slow typing gaps", () => {
    expect(shouldResetWedgeBuffer(1000, 1100)).toBe(true);
    expect(shouldResetWedgeBuffer(1000, 1020)).toBe(false);
  });
});

describe("formatSerialPortError", () => {
  it("returns Linux dialout guidance for access denied", () => {
    const msg = formatSerialPortError(new Error("Permission denied"));
    expect(msg).toContain("dialout");
  });
});

describe("posScanFeedback", () => {
  it("exposes sound URLs and status messages", () => {
    expect(SCAN_SOUND_URLS.success).toContain("scan-success.mp3");
    expect(SCAN_SOUND_URLS.error).toContain("scan-error.mp3");
    expect(scanAddedMessage("Widget")).toContain("Widget");
    expect(scanNotFoundMessage()).toContain("no product");
  });
});
