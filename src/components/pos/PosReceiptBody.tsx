import { formatCurrency } from "@/lib/currency";
import type { ReceiptSnapshot } from "@/hooks/usePosCart";
import {
  formatReceiptFieldValue,
  getReceiptFooterMessage,
  shouldDisplayReceiptRender,
} from "@/lib/posReceiptUtils";

type ReceiptField = { key: string; label: string; value: string };
type ReceiptSection = { label: string; fields: ReceiptField[] };

export type ReceiptDTO = {
  sale_id?: string;
  ref_number?: string;
  store?: Record<string, string>;
  header?: Record<string, string>;
  footer?: Record<string, string>;
  transaction?: Record<string, string>;
  branch?: Record<string, string>;
  customer?: Record<string, string>;
  staff?: Record<string, string>;
  lines?: Array<Record<string, string | number>>;
  totals?: Record<string, string | number>;
  payments?: Array<Record<string, string | number>>;
  discounts?: Record<string, string | number>;
  policies?: Record<string, string>;
  sections?: ReceiptSection[];
};

const SECTION_LABELS: Record<string, string> = {
  store: "Store",
  branch: "Branch",
  transaction: "Transaction",
  customer: "Customer",
  staff: "Staff",
  totals: "Totals",
  discounts: "Discounts",
  policies: "Policies",
};

const FIELD_LABELS: Record<string, string> = {
  store_name: "Store Name",
  store_email: "Email",
  store_code: "Code",
  branch_name: "Branch",
  branch_code: "Code",
  branch_address: "Address",
  branch_phone: "Phone",
  ref_number: "Invoice",
  transaction_date: "Date",
  transaction_time: "Time",
  customer_name: "Customer",
  customer_phone: "Phone",
  customer_email: "Email",
  cashier_name: "Cashier",
  cashier_id: "Cashier ID",
  subtotal: "Subtotal",
  tax_rate: "Tax Rate",
  tax_amount: "Tax",
  discount_total: "Discount",
  grand_total: "Grand Total",
  return_policy: "Return Policy",
  warranty_policy: "Warranty",
  payment_methods: "Payment",
  notes: "Notes",
};

function dictToFields(dict: Record<string, unknown>): ReceiptField[] {
  return Object.entries(dict)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .filter(([, v]) => typeof v !== "object" || Array.isArray(v))
    .map(([key, value]) => ({
      key,
      label:
        FIELD_LABELS[key] ??
        key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: formatReceiptFieldValue(key, value),
    }));
}

export function buildReceiptSections(receipt: ReceiptDTO): ReceiptSection[] {
  if (receipt.sections && receipt.sections.length > 0) {
    return receipt.sections;
  }

  const sections: ReceiptSection[] = [];

  if (receipt.header && Object.keys(receipt.header).length > 0) {
    const fields = dictToFields(receipt.header);
    if (fields.length > 0) {
      sections.push({ label: "Header", fields });
    }
  }

  for (const sectionKey of ["store", "branch", "transaction", "customer", "staff"] as const) {
    const dict = receipt[sectionKey];
    if (dict && Object.keys(dict).length > 0) {
      const fields = dictToFields(dict);
      if (fields.length > 0) {
        sections.push({ label: SECTION_LABELS[sectionKey] ?? sectionKey, fields });
      }
    }
  }

  if (receipt.lines && receipt.lines.length > 0) {
    const lineFields: ReceiptField[] = receipt.lines.map((line, idx) => {
      const name = line.product_name ?? line.item ?? line.name ?? `Item ${idx + 1}`;
      const qty = line.quantity ?? 1;
      const price = line.line_total ?? line.unit_price ?? "";
      return {
        key: `line-${idx}`,
        label: `${name} x${qty}`,
        value: String(price),
      };
    });
    sections.push({ label: "Items", fields: lineFields });
  }

  if (receipt.totals && Object.keys(receipt.totals).length > 0) {
    const fields = dictToFields(receipt.totals);
    if (fields.length > 0) {
      sections.push({ label: "Totals", fields });
    }
  }

  if (receipt.payments && receipt.payments.length > 0) {
    const payFields: ReceiptField[] = receipt.payments.map((p, idx) => ({
      key: `payment-${idx}`,
      label: String(p.method_label ?? p.method ?? `Payment ${idx + 1}`),
      value: String(p.amount ?? ""),
    }));
    sections.push({ label: "Payments", fields: payFields });
  }

  if (receipt.discounts && Object.keys(receipt.discounts).length > 0) {
    const fields = dictToFields(receipt.discounts);
    if (fields.length > 0) {
      sections.push({ label: "Discounts", fields });
    }
  }

  if (receipt.policies && Object.keys(receipt.policies).length > 0) {
    const fields = dictToFields(receipt.policies);
    if (fields.length > 0) {
      sections.push({ label: "Policies", fields });
    }
  }

  return sections;
}

/** Styles embedded in the print window — must match semantic classes on PosReceiptBody. */
export const RECEIPT_PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #111;
    padding: 16px;
    max-width: 80mm;
    margin: 0 auto;
    background: #fff;
  }
  .pos-receipt { width: 100%; }
  .receipt-header {
    text-align: center;
    margin-bottom: 12px;
    border-bottom: 1px dashed #000;
    padding-bottom: 8px;
  }
  .receipt-header h2 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
  .receipt-header p { font-size: 11px; color: #333; }
  .receipt-section { margin-bottom: 10px; }
  .receipt-section-title {
    font-weight: bold;
    font-size: 11px;
    text-transform: uppercase;
    margin-bottom: 4px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 2px;
  }
  .receipt-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    padding: 2px 0;
    font-size: 12px;
  }
  .receipt-row .label { color: #555; flex: 1; word-break: break-word; }
  .receipt-row .value { font-weight: bold; text-align: right; white-space: nowrap; }
  .receipt-total {
    border-top: 2px solid #000;
    margin-top: 8px;
    padding-top: 8px;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
  }
  .receipt-render {
    margin-top: 12px;
    font-size: 11px;
    white-space: pre-wrap;
    font-family: 'Courier New', Courier, monospace;
  }
  .receipt-footer {
    text-align: center;
    margin-top: 16px;
    border-top: 1px dashed #000;
    padding-top: 8px;
    font-size: 10px;
    color: #666;
  }
  @media print {
    body { padding: 0; max-width: none; }
    @page { margin: 4mm; size: auto; }
  }
`;

export function printReceiptContent(element: HTMLElement, invoiceId: string): void {
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) return;

  const safeTitle = invoiceId.replace(/[<>&"]/g, "");
  printWindow.document.open();
  printWindow.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt - ${safeTitle}</title>` +
      `<style>${RECEIPT_PRINT_STYLES}</style></head><body>`,
  );
  printWindow.document.write(element.innerHTML);
  printWindow.document.write("</body></html>");
  printWindow.document.close();

  // Wait for layout before printing — immediate print/close often blanks in WebView/Tauri.
  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } finally {
      // Delay close so the print dialog can attach to the document.
      window.setTimeout(() => {
        try {
          printWindow.close();
        } catch {
          /* ignore */
        }
      }, 250);
    }
  };

  if (printWindow.document.readyState === "complete") {
    window.setTimeout(triggerPrint, 50);
  } else {
    printWindow.addEventListener("load", () => window.setTimeout(triggerPrint, 50));
  }
}

type Props = {
  snapshot: ReceiptSnapshot;
};

export function PosReceiptBody({ snapshot }: Props) {
  const receipt = snapshot.receipt as ReceiptDTO | undefined;
  const sections = receipt ? buildReceiptSections(receipt) : [];

  // Semantic classes power the print stylesheet; inline styles keep the
  // on-screen dialog correct without relying on Tailwind in the print window.
  return (
    <div className="pos-receipt" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#111" }}>
      <div
        className="receipt-header"
        style={{
          textAlign: "center",
          marginBottom: 12,
          borderBottom: "1px dashed #000",
          paddingBottom: 8,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>Sale Receipt</h2>
        <p style={{ fontSize: 11, color: "#333" }}>{snapshot.invoiceId}</p>
      </div>

      {sections.length > 0 ? (
        sections.map((section, idx) => (
          <div key={idx} className="receipt-section" style={{ marginBottom: 10 }}>
            <div
              className="receipt-section-title"
              style={{
                fontWeight: "bold",
                fontSize: 11,
                textTransform: "uppercase",
                marginBottom: 4,
                borderBottom: "1px solid #ccc",
                paddingBottom: 2,
              }}
            >
              {section.label}
            </div>
            {section.fields.map((field) => (
              <div
                key={field.key}
                className="receipt-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "2px 0",
                  fontSize: 12,
                }}
              >
                <span className="label" style={{ color: "#555", flex: 1, wordBreak: "break-word" }}>
                  {field.label}
                </span>
                <span className="value" style={{ fontWeight: "bold", textAlign: "right", whiteSpace: "nowrap" }}>
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div
          className="receipt-row"
          style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 12 }}
        >
          <span className="label" style={{ color: "#555" }}>
            Payment Method
          </span>
          <span className="value" style={{ fontWeight: "bold" }}>
            {snapshot.paymentLabel}
          </span>
        </div>
      )}

      <div
        className="receipt-total"
        style={{
          borderTop: "2px solid #000",
          marginTop: 8,
          paddingTop: 8,
          fontSize: 14,
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Total Paid</span>
        <span>{formatCurrency(snapshot.totalPayable)}</span>
      </div>

      {shouldDisplayReceiptRender(snapshot.receiptRender) && (
        <div
          className="receipt-render"
          style={{ marginTop: 12, fontSize: 11, whiteSpace: "pre-wrap", fontFamily: "monospace" }}
          dangerouslySetInnerHTML={{ __html: snapshot.receiptRender! }}
        />
      )}

      <div
        className="receipt-footer"
        style={{
          textAlign: "center",
          marginTop: 16,
          borderTop: "1px dashed #000",
          paddingTop: 8,
          fontSize: 10,
          color: "#666",
        }}
      >
        {getReceiptFooterMessage(receipt)}
      </div>
    </div>
  );
}
