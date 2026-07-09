const raw = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace(
  /\/$/,
  "",
);

const publicRaw = (import.meta.env.VITE_PUBLIC_API_BASE_URL || raw).replace(/\/$/, "");

export const API_BASE_URL = raw;
export const PUBLIC_API_BASE_URL = publicRaw;

/** Backend origin for absolute media URLs when API base is a full URL (local/dev). */
export function getBackendOrigin(): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      return new URL(raw).origin;
    } catch {
      return "";
    }
  }
  return "";
}

export type AuthTokens = {
  access: string;
  refresh: string;
};
