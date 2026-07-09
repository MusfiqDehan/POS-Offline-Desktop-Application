export const POS_PRODUCT_SEARCH_ID = "pos-product-search";
export const POS_BARCODE_INPUT_ID = "pos-barcode-input";

export const POS_SCAN_MIN_LENGTH = 3;
export const POS_SCAN_IDLE_MS = 300;
export const POS_SCAN_MAX_KEY_INTERVAL_MS = 50;
/** Max time for a full wedge scan into the search field (human typing is slower). */
export const POS_SEARCH_WEDGE_MAX_DURATION_MS = 900;
/** Wait after last character before auto-submitting a wedge scan in search. */
export const POS_SEARCH_SUBMIT_IDLE_MS = 120;
/** Ignore duplicate scan submissions within this window. */
export const POS_SCAN_DEDUP_MS = 600;

export const POS_SCAN_TERMINATOR_KEYS = new Set([
  "Enter",
  "NumpadEnter",
  "Tab",
]);

export function isScanTerminatorKey(event: KeyboardEvent): boolean {
  if (POS_SCAN_TERMINATOR_KEYS.has(event.key)) {
    return true;
  }
  // Some USB wedge scanners only expose legacy keyCode.
  return event.keyCode === 13 || event.keyCode === 9;
}

export function isRapidWedgeInput(
  durationMs: number,
  charCount: number,
  maxDurationMs = POS_SEARCH_WEDGE_MAX_DURATION_MS,
): boolean {
  return charCount >= POS_SCAN_MIN_LENGTH && durationMs <= maxDurationMs;
}

export function isEditableElement(element: HTMLElement): boolean {
  const tag = element.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    element.isContentEditable
  );
}

export function isPosProductSearchInput(
  element: EventTarget | null,
): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement && element.id === POS_PRODUCT_SEARCH_ID
  );
}

export function isPosBarcodeInput(
  element: EventTarget | null,
): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement && element.id === POS_BARCODE_INPUT_ID
  );
}

export function shouldResetWedgeBuffer(
  lastKeyAt: number,
  now: number,
  maxIntervalMs = POS_SCAN_MAX_KEY_INTERVAL_MS,
): boolean {
  return lastKeyAt > 0 && now - lastKeyAt > maxIntervalMs;
}
