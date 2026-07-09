import { getBackendOrigin } from "./env";

/** Default placeholder shown when a product has no image. */
export const DEFAULT_POS_PRODUCT_IMAGE = "/product-placeholder.svg";

const STATIC_ASSET_PREFIX = "/";

/** Resolve Django /media/ paths against the backend origin when API is on another host. */
export function resolveMediaUrl(src: string): string {
  if (!src.startsWith("/media/")) {
    return src;
  }
  const origin = getBackendOrigin();
  return origin ? `${origin}${src}` : src;
}

/** Resolve product image URL for img src (supports /media/, absolute URLs, and static assets). */
export function resolveProductImageUrl(
  src: string | null | undefined,
  fallback: string = DEFAULT_POS_PRODUCT_IMAGE,
): string {
  if (!src || !src.trim()) {
    return fallback.startsWith("http") || fallback.startsWith("/")
      ? fallback
      : `${STATIC_ASSET_PREFIX}${fallback}`;
  }
  const trimmed = src.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/media/")) {
    return resolveMediaUrl(trimmed);
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return `${STATIC_ASSET_PREFIX}${trimmed}`;
}
