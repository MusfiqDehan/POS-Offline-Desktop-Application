import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PosProductsPanel } from "@/components/pos/PosProductsPanel";
import { DEFAULT_POS_PRODUCT_IMAGE } from "@/lib/media";
import type { PosProductRow } from "@/lib/pos-types";

vi.mock("@/lib/env", () => ({
  API_BASE_URL: "http://localhost:8002/api/v1",
  PUBLIC_API_BASE_URL: "http://localhost:8002/api/v1",
  getBackendOrigin: () => "http://localhost:8002",
}));

function productRow(overrides: Partial<PosProductRow> = {}): PosProductRow {
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

describe("PosProductsPanel images", () => {
  const baseProps = {
    categories: [{ id: "all", name: "All", count: 1 }],
    activeTab: "all",
    onTabChange: () => {},
    productsLoading: false,
    cartProductIds: new Set<string>(),
    onProductSelect: () => {},
    searchQuery: "",
    onSearchChange: () => {},
    onBarcodeScan: () => {},
  };

  it("renders placeholder image when product has no image", () => {
    render(
      <PosProductsPanel {...baseProps} products={[productRow({ image: "" })]} />,
    );

    const img = screen.getByRole("img", { name: "Widget" });
    expect(img).toHaveAttribute("src", DEFAULT_POS_PRODUCT_IMAGE);
  });

  it("renders resolved media URL for product image", () => {
    render(
      <PosProductsPanel
        {...baseProps}
        products={[productRow({ image: "/media/assets/image/widget.png" })]}
      />,
    );

    const img = screen.getByRole("img", { name: "Widget" });
    expect(img).toHaveAttribute(
      "src",
      "http://localhost:8002/media/assets/image/widget.png",
    );
  });

  it("renders visible scan or type barcode field", () => {
    render(<PosProductsPanel {...baseProps} products={[]} />);
    expect(
      screen.getByPlaceholderText("Scan or type barcode…"),
    ).toBeInTheDocument();
  });
});
