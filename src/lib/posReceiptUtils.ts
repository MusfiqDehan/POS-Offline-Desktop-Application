type ReceiptFooter = {
  footer?: { text?: string };
};

export function shouldDisplayReceiptRender(receiptRender?: string): boolean {
  if (!receiptRender?.trim()) return false;
  const trimmed = receiptRender.trim();
  return !trimmed.startsWith("{") && !trimmed.startsWith("[");
}

export function getReceiptFooterMessage(receipt?: ReceiptFooter): string {
  const text = receipt?.footer?.text;
  if (typeof text === "string" && text.trim()) return text;
  return "Thank you for your purchase!";
}

const TWENTY_FOUR_HOUR_TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

export function formatReceiptTime12Hour(timeValue: string): string {
  const match = TWENTY_FOUR_HOUR_TIME.exec(timeValue.trim());
  if (!match) return timeValue;

  const hour24 = Number.parseInt(match[1], 10);
  const minutes = match[2];
  const seconds = match[3];
  if (Number.isNaN(hour24) || hour24 > 23) return timeValue;

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  if (seconds) {
    return `${hour12}:${minutes}:${seconds} ${period}`;
  }
  return `${hour12}:${minutes} ${period}`;
}

export function formatReceiptFieldValue(key: string, value: unknown): string {
  const text =
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : Array.isArray(value)
        ? value.join(", ")
        : "";

  if ((key === "time" || key === "transaction_time") && text) {
    return formatReceiptTime12Hour(text);
  }
  return text;
}

export type ReceiptRenderPayload = {
  formatter?: string;
  body?: string;
};

/** Normalize checkout `receipt_render` into a displayable HTML/text string. */
export function extractReceiptRender(render: unknown): string | undefined {
  if (typeof render !== "object" || render === null) {
    return typeof render === "string" ? render : undefined;
  }
  const payload = render as ReceiptRenderPayload;
  if (payload.formatter === "json") return undefined;
  return payload.body ?? undefined;
}
