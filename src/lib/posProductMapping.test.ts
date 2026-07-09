import { describe, expect, it, vi } from "vitest";
import { apiRowToPosProduct } from "@/lib/posProductMapping";
import type { PosProductRow } from "@/lib/pos-types";
import { DEFAULT_POS_PRODUCT_IMAGE } from "@/lib/media";

vi.mock("./env", () => ({
  API_BASE_URL: "http://localhost:8002/api/v1",
  PUBLIC_API_BASE_URL: "http://localhost:8002/api/v1",
  getBackendOrigin: () => "http://localhost:8002",
}));

function baseRow(overrides: Partial<PosProductRow> = {}): PosProductRow {
  return {
    id: "prod-1",
    name: "Widget",
    sku: "W-1",
    barcode: "123",
    price: "10.00",
    available_stock: "12",
    category_id: "cat-1",
    category_name: "General",
    image: "",
    tax_type: "exclusive",
    unit_name: "pcs",
    selling_type: "retail",
    entity_type: "product",
    variant_id: null,
    package_id: null,
    unit_quantity: 1,
    ...overrides,
  };
}

describe("apiRowToPosProduct imageSrc", () => {
  it("maps /media/ image to absolute backend URL", () => {
    const product = apiRowToPosProduct(
      baseRow({ image: "/media/assets/image/widget.png" }),
    );
    expect(product.imageSrc).toBe(
      "http://localhost:8002/media/assets/image/widget.png",
    );
  });

  it("uses placeholder when image is empty", () => {
    const product = apiRowToPosProduct(baseRow({ image: "" }));
    expect(product.imageSrc).toBe(DEFAULT_POS_PRODUCT_IMAGE);
  });

  it("passes through absolute image URLs", () => {
    const product = apiRowToPosProduct(
      baseRow({ image: "https://cdn.example.com/p.jpg" }),
    );
    expect(product.imageSrc).toBe("https://cdn.example.com/p.jpg");
  });
});
