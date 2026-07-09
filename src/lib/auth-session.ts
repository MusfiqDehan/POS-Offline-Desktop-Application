export type SessionKind = "tenant";

const ACCESS_KEY = "sortorium_access_token";
const REFRESH_KEY = "sortorium_refresh_token";
const KIND_KEY = "sortorium_session_kind";

export type AuthSession = {
  access: string;
  refresh: string;
  kind: SessionKind;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function saveSession(session: AuthSession): void {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_KEY, session.access);
  localStorage.setItem(REFRESH_KEY, session.refresh);
  localStorage.setItem(KIND_KEY, session.kind);
}

export function clearSession(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(KIND_KEY);
}

export function getAccessToken(): string {
  if (!canUseStorage()) return "";
  return localStorage.getItem(ACCESS_KEY) || "";
}

export function getSessionKind(): SessionKind | null {
  if (!canUseStorage()) return null;
  const kind = localStorage.getItem(KIND_KEY);
  return kind === "tenant" ? kind : null;
}

export function isTenantSession(): boolean {
  return getSessionKind() === "tenant";
}
