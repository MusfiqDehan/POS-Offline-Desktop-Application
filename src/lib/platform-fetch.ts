function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Use native HTTP in Tauri (no WebView CORS); browser fetch in Vitest/dev web. */
export async function platformFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  if (isTauriRuntime()) {
    const { fetch } = await import("@tauri-apps/plugin-http");
    return fetch(url, init);
  }

  return fetch(url, init);
}
