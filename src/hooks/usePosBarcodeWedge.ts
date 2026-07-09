import { useEffect, useRef } from "react";
import {
  isEditableElement,
  isPosBarcodeInput,
  isPosProductSearchInput,
  isRapidWedgeInput,
  isScanTerminatorKey,
  POS_BARCODE_INPUT_ID,
  POS_PRODUCT_SEARCH_ID,
  POS_SCAN_DEDUP_MS,
  POS_SCAN_IDLE_MS,
  POS_SCAN_MIN_LENGTH,
  POS_SEARCH_SUBMIT_IDLE_MS,
  shouldResetWedgeBuffer,
} from "@/lib/posBarcodeWedge";

type Options = {
  enabled?: boolean;
  onScan: (code: string) => void;
  clearSearch?: () => void;
};

/**
 * Captures USB barcode scanner input (keyboard wedge) on the POS page.
 * Supports scanners with or without Enter/Tab suffix (e.g. Yumite YT-100).
 */
export function usePosBarcodeWedge({
  enabled = true,
  onScan,
  clearSearch,
}: Options): void {
  const onScanRef = useRef(onScan);
  const clearSearchRef = useRef(clearSearch);

  onScanRef.current = onScan;
  clearSearchRef.current = clearSearch;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const bufferRef = { value: "" };
    const lastKeyAtRef = { value: 0 };
    const lastSubmitRef = { code: "", at: 0 };
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const resetBuffer = () => {
      bufferRef.value = "";
      lastKeyAtRef.value = 0;
    };

    const submitCode = (code: string) => {
      const trimmed = code.trim();
      if (trimmed.length < POS_SCAN_MIN_LENGTH) {
        return;
      }

      const now = Date.now();
      if (
        trimmed === lastSubmitRef.code &&
        now - lastSubmitRef.at < POS_SCAN_DEDUP_MS
      ) {
        return;
      }

      lastSubmitRef.code = trimmed;
      lastSubmitRef.at = now;
      onScanRef.current(trimmed);
    };

    const scheduleBufferIdleSubmit = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      idleTimer = setTimeout(() => {
        if (bufferRef.value.length >= POS_SCAN_MIN_LENGTH) {
          submitCode(bufferRef.value);
        }
        resetBuffer();
      }, POS_SCAN_IDLE_MS);
    };

    const completeSearchScan = (input: HTMLInputElement) => {
      const code = input.value.trim();
      if (code.length < POS_SCAN_MIN_LENGTH) {
        return;
      }
      submitCode(code);
      clearSearchRef.current?.();
      resetBuffer();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      if (isPosProductSearchInput(target) || isPosBarcodeInput(target)) {
        if (!isScanTerminatorKey(event)) {
          return;
        }

        event.preventDefault();
        completeSearchScan(target);
        return;
      }

      if (target instanceof HTMLElement && isEditableElement(target)) {
        return;
      }

      if (isScanTerminatorKey(event)) {
        if (bufferRef.value.length >= POS_SCAN_MIN_LENGTH) {
          event.preventDefault();
          submitCode(bufferRef.value);
        }
        resetBuffer();
        return;
      }

      if (
        event.key.length !== 1 ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const now = Date.now();
      if (shouldResetWedgeBuffer(lastKeyAtRef.value, now)) {
        bufferRef.value = "";
      }

      lastKeyAtRef.value = now;
      bufferRef.value += event.key;
      scheduleBufferIdleSubmit();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isScanTerminatorKey(event)) {
        return;
      }

      const target = event.target;
      if (isPosProductSearchInput(target) || isPosBarcodeInput(target)) {
        completeSearchScan(target);
        return;
      }

      if (target instanceof HTMLElement && isEditableElement(target)) {
        return;
      }

      if (bufferRef.value.length >= POS_SCAN_MIN_LENGTH) {
        submitCode(bufferRef.value);
      }
      resetBuffer();
    };

    const searchStartedAtRef = { value: 0 };
    let searchSubmitTimer: ReturnType<typeof setTimeout> | null = null;

    const handleSearchInput = (event: Event) => {
      const input = event.target;
      if (!isPosProductSearchInput(input) && !isPosBarcodeInput(input)) {
        return;
      }

      const now = Date.now();
      if (
        !searchStartedAtRef.value ||
        now - searchStartedAtRef.value > POS_SCAN_IDLE_MS * 3
      ) {
        searchStartedAtRef.value = now;
      }

      if (searchSubmitTimer) {
        clearTimeout(searchSubmitTimer);
      }

      searchSubmitTimer = setTimeout(() => {
        const code = input.value.trim();
        const duration = Date.now() - searchStartedAtRef.value;
        if (isRapidWedgeInput(duration, code.length)) {
          submitCode(code);
          clearSearchRef.current?.();
          if (isPosBarcodeInput(input)) {
            input.value = "";
          }
        }
        searchStartedAtRef.value = 0;
      }, POS_SEARCH_SUBMIT_IDLE_MS);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);

    const attachListeners = () => {
      const els: HTMLInputElement[] = [];
      for (const id of [POS_PRODUCT_SEARCH_ID, POS_BARCODE_INPUT_ID]) {
        const el = document.getElementById(id);
        if (el instanceof HTMLInputElement) {
          el.addEventListener("input", handleSearchInput);
          els.push(el);
        }
      }
      return els;
    };

    let attached = attachListeners();
    const domObserver = new MutationObserver(() => {
      const missing = attached.some((el) => !document.contains(el));
      if (missing || attached.length === 0) {
        for (const el of attached) {
          el.removeEventListener("input", handleSearchInput);
        }
        attached = attachListeners();
      }
    });
    domObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      for (const el of attached) {
        el.removeEventListener("input", handleSearchInput);
      }
      domObserver.disconnect();
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      if (searchSubmitTimer) {
        clearTimeout(searchSubmitTimer);
      }
    };
  }, [enabled]);
}
