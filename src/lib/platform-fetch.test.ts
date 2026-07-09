import { afterEach, describe, expect, it, vi } from "vitest";

describe("platformFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("uses global fetch when not running inside Tauri", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", mockFetch);

    const { platformFetch } = await import("./platform-fetch");
    await platformFetch("http://localhost:8000/api/v1/health/");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/health/",
      undefined,
    );
  });

  it("uses Tauri HTTP plugin fetch when __TAURI_INTERNALS__ is present", async () => {
    const tauriFetch = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    vi.doMock("@tauri-apps/plugin-http", () => ({ fetch: tauriFetch }));

    const { platformFetch } = await import("./platform-fetch");
    await platformFetch("https://sortorium.com/api/v1/health/", {
      method: "GET",
    });

    expect(tauriFetch).toHaveBeenCalledWith("https://sortorium.com/api/v1/health/", {
      method: "GET",
    });
  });
});
