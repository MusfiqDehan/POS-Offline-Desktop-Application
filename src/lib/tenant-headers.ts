let currentSubdomain = "";

export function setTenantSubdomain(subdomain: string): void {
  currentSubdomain = subdomain.trim().toLowerCase();
}

export function getTenantSubdomain(): string {
  return currentSubdomain;
}

export function buildTenantRequestHeaders(): Record<string, string> {
  if (!currentSubdomain) return {};
  return { "X-Tenant-Subdomain": currentSubdomain };
}
