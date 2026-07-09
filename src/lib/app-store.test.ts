import { beforeEach, describe, expect, it } from "vitest";
import {
  getStoredSubdomain,
  setStoredSubdomain,
  shouldRememberSubdomain,
} from "@/lib/app-store";
import { hasPermission } from "@/lib/permissions";

describe("subdomain persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("remembers subdomain when opted in", async () => {
    await setStoredSubdomain("Jubayer", true);
    expect(await shouldRememberSubdomain()).toBe(true);
    expect(await getStoredSubdomain()).toBe("jubayer");
  });

  it("does not persist subdomain when remember is false", async () => {
    await setStoredSubdomain("jubayer", false);
    expect(await getStoredSubdomain()).toBe("");
  });

  it("rejects access without pos edit", () => {
    expect(hasPermission({ pos: "view" }, "pos", "edit")).toBe(false);
    expect(hasPermission({ pos: "full" }, "pos", "edit")).toBe(true);
  });
});
