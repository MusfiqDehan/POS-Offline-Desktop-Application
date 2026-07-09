export function parseCurrency(value: string | number): number {
  if (typeof value === "number") return value;
  return Number.parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}
