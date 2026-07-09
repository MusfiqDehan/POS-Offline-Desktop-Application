import { DEFAULT_POS_PRODUCT_IMAGE, resolveProductImageUrl } from "@/lib/media";
import type { PosProductRow } from "@/lib/pos-types";

export type PosProduct = {
  id: string;
  productId: string;
  variantId: string | null;
  packageId: string | null;
  name: string;
  sku: string;
  price: string;
  stockLabel: string;
  stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  imageSrc: string;
};

export function buildCartLineKey(input: {
  productId: string;
  variantId?: string | null;
  packageId?: string | null;
}): string {
  return [input.productId, input.variantId ?? "", input.packageId ?? ""].join(":");
}

export function apiRowToPosProduct(row: PosProductRow): PosProduct {
  const stock = Number.parseFloat(row.available_stock || "0");
  let stockStatus: PosProduct["stockStatus"] = "in-stock";
  if (stock <= 0) stockStatus = "out-of-stock";
  else if (stock <= 5) stockStatus = "low-stock";

  return {
    id: buildCartLineKey({
      productId: row.id,
      variantId: row.variant_id,
      packageId: row.package_id,
    }),
    productId: row.id,
    variantId: row.variant_id,
    packageId: row.package_id,
    name: row.name,
    sku: row.sku,
    price: row.price,
    stockLabel: `${row.available_stock} ${row.unit_name || "pcs"}`,
    stockStatus,
    imageSrc: resolveProductImageUrl(row.image, DEFAULT_POS_PRODUCT_IMAGE),
  };
}
