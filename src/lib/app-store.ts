const SUBDOMAIN_KEY = "tenant_subdomain";
const REMEMBER_SUBDOMAIN_KEY = "remember_subdomain";
const BRANCH_KEY = "active_branch_id";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function getTauriStore() {
  const { load } = await import("@tauri-apps/plugin-store");
  return load("settings.json", { defaults: {}, autoSave: true });
}

export async function getStoredSubdomain(): Promise<string> {
  if (!isTauri()) {
    return localStorage.getItem(SUBDOMAIN_KEY) ?? "";
  }
  const store = await getTauriStore();
  return (await store.get<string>(SUBDOMAIN_KEY)) ?? "";
}

export async function setStoredSubdomain(subdomain: string, remember: boolean): Promise<void> {
  const value = subdomain.trim().toLowerCase();
  if (!isTauri()) {
    localStorage.setItem(REMEMBER_SUBDOMAIN_KEY, String(remember));
    if (remember) localStorage.setItem(SUBDOMAIN_KEY, value);
    else localStorage.removeItem(SUBDOMAIN_KEY);
    return;
  }
  const store = await getTauriStore();
  await store.set(REMEMBER_SUBDOMAIN_KEY, remember);
  if (remember) await store.set(SUBDOMAIN_KEY, value);
  else await store.delete(SUBDOMAIN_KEY);
  await store.save();
}

export async function shouldRememberSubdomain(): Promise<boolean> {
  if (!isTauri()) {
    return localStorage.getItem(REMEMBER_SUBDOMAIN_KEY) === "true";
  }
  const store = await getTauriStore();
  return Boolean(await store.get<boolean>(REMEMBER_SUBDOMAIN_KEY));
}

export async function getActiveBranchId(): Promise<string | null> {
  if (!isTauri()) {
    return localStorage.getItem(BRANCH_KEY);
  }
  const store = await getTauriStore();
  return (await store.get<string>(BRANCH_KEY)) ?? null;
}

export async function setActiveBranchId(id: string): Promise<void> {
  if (!isTauri()) {
    localStorage.setItem(BRANCH_KEY, id);
    return;
  }
  const store = await getTauriStore();
  await store.set(BRANCH_KEY, id);
  await store.save();
}
