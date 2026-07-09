const raw = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace(
  /\/$/,
  "",
);

const publicRaw = (import.meta.env.VITE_PUBLIC_API_BASE_URL || raw).replace(/\/$/, "");

export const API_BASE_URL = raw;
export const PUBLIC_API_BASE_URL = publicRaw;

export type AuthTokens = {
  access: string;
  refresh: string;
};
