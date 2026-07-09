import { describe, expect, it } from "vitest";
import { getBackendOrigin, API_BASE_URL } from "./env";

describe("getBackendOrigin", () => {
  it("returns the origin of VITE_API_BASE_URL when it is an absolute URL", () => {
    expect(API_BASE_URL.startsWith("http")).toBe(true);
    const origin = getBackendOrigin();
    expect(origin).toMatch(/^https?:\/\//);
    expect(API_BASE_URL.startsWith(origin)).toBe(true);
  });
});
