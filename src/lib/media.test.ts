import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_POS_PRODUCT_IMAGE,
  resolveMediaUrl,
  resolveProductImageUrl,
} from "@/lib/media";

vi.mock("./env", () => ({
  API_BASE_URL: "http://localhost:8002/api/v1",
  PUBLIC_API_BASE_URL: "http://localhost:8002/api/v1",
  getBackendOrigin: vi.fn(),
}));

import { getBackendOrigin } from "./env";

const mockedGetBackendOrigin = vi.mocked(getBackendOrigin);

describe("resolveMediaUrl", () => {
  beforeEach(() => {
    mockedGetBackendOrigin.mockReset();
  });

  it("prefixes /media/ URLs with backend origin", () => {
    mockedGetBackendOrigin.mockReturnValue("http://localhost:8002");
    expect(resolveMediaUrl("/media/assets/image/test.png")).toBe(
      "http://localhost:8002/media/assets/image/test.png",
    );
  });

  it("keeps /media/ URLs relative when origin is empty", () => {
    mockedGetBackendOrigin.mockReturnValue("");
    expect(resolveMediaUrl("/media/assets/image/test.png")).toBe(
      "/media/assets/image/test.png",
    );
  });
});

describe("resolveProductImageUrl", () => {
  beforeEach(() => {
    mockedGetBackendOrigin.mockReturnValue("");
  });

  it("returns fallback for empty input", () => {
    expect(resolveProductImageUrl("")).toContain(DEFAULT_POS_PRODUCT_IMAGE);
  });

  it("returns fallback for null/undefined", () => {
    expect(resolveProductImageUrl(null)).toContain(DEFAULT_POS_PRODUCT_IMAGE);
    expect(resolveProductImageUrl(undefined)).toContain(DEFAULT_POS_PRODUCT_IMAGE);
  });

  it("prefixes /media/ URLs when backend origin is configured", () => {
    mockedGetBackendOrigin.mockReturnValue("http://localhost:8002");
    expect(resolveProductImageUrl("/media/assets/image/test.png")).toBe(
      "http://localhost:8002/media/assets/image/test.png",
    );
  });

  it("passes through absolute URLs", () => {
    expect(resolveProductImageUrl("https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg",
    );
  });

  it("prefixes relative asset paths with /", () => {
    expect(resolveProductImageUrl("assets/img/foo.png")).toBe("/assets/img/foo.png");
  });
});
