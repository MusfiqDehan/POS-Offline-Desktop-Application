import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import {
  extractReceiptRender,
  formatReceiptTime12Hour,
  getReceiptFooterMessage,
  shouldDisplayReceiptRender,
} from "@/lib/posReceiptUtils";
import {
  buildReceiptSections,
  PosReceiptBody,
  printReceiptContent,
  RECEIPT_PRINT_STYLES,
  type ReceiptDTO,
} from "@/components/pos/PosReceiptBody";

describe("shouldDisplayReceiptRender", () => {
  it("returns false for JSON receipt render bodies", () => {
    expect(shouldDisplayReceiptRender('{"sale_id":"123"}')).toBe(false);
    expect(shouldDisplayReceiptRender('[{"line":1}]')).toBe(false);
  });

  it("returns true for HTML receipt render bodies", () => {
    expect(shouldDisplayReceiptRender("<p>Thank you</p>")).toBe(true);
  });
});

describe("getReceiptFooterMessage", () => {
  it("uses configured footer text", () => {
    expect(getReceiptFooterMessage({ footer: { text: "Visit again soon." } })).toBe(
      "Visit again soon.",
    );
  });

  it("falls back to thank-you message", () => {
    expect(getReceiptFooterMessage({})).toBe("Thank you for your purchase!");
  });
});

describe("formatReceiptTime12Hour", () => {
  it("converts 24h times", () => {
    expect(formatReceiptTime12Hour("23:07:05")).toBe("11:07:05 PM");
    expect(formatReceiptTime12Hour("00:30:00")).toBe("12:30:00 AM");
  });
});

describe("extractReceiptRender", () => {
  it("returns string bodies and skips json formatter", () => {
    expect(extractReceiptRender("<p>Hi</p>")).toBe("<p>Hi</p>");
    expect(extractReceiptRender({ formatter: "json", body: "{}" })).toBeUndefined();
    expect(extractReceiptRender({ formatter: "html", body: "<b>Ok</b>" })).toBe("<b>Ok</b>");
  });
});

describe("buildReceiptSections", () => {
  it("builds store, items, totals, and payments sections", () => {
    const receipt: ReceiptDTO = {
      store: { store_name: "Sortorium" },
      lines: [{ product_name: "Widget", quantity: 2, line_total: "20.00" }],
      totals: { subtotal: "20.00", grand_total: "20.00" },
      payments: [{ method_label: "Cash", amount: "20.00" }],
    };
    const sections = buildReceiptSections(receipt);
    expect(sections.map((s) => s.label)).toEqual([
      "Store",
      "Items",
      "Totals",
      "Payments",
    ]);
    expect(sections[1].fields[0].label).toBe("Widget x2");
  });
});

describe("PosReceiptBody print markup", () => {
  it("emits semantic receipt classes that print CSS targets", () => {
    const { container } = render(
      <PosReceiptBody
        snapshot={{
          invoiceId: "INV-1",
          totalPayable: 20,
          paymentLabel: "Cash",
          receipt: {
            store: { store_name: "Sortorium" },
            lines: [{ product_name: "Widget", quantity: 1, line_total: "20.00" }],
            totals: { grand_total: "20.00" },
            payments: [{ method_label: "Cash", amount: "20.00" }],
          },
        }}
      />,
    );

    expect(container.querySelector(".receipt-header")).not.toBeNull();
    expect(container.querySelector(".receipt-section-title")).not.toBeNull();
    expect(container.querySelector(".receipt-row")).not.toBeNull();
    expect(container.querySelector(".receipt-total")).not.toBeNull();
    expect(container.querySelector(".receipt-footer")).not.toBeNull();
    expect(RECEIPT_PRINT_STYLES).toContain(".receipt-row");
  });

  it("writes receipt HTML and print styles into the print window", () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const close = vi.fn();
    const focus = vi.fn();
    const print = vi.fn();
    const addEventListener = vi.fn();
    const printWindow = {
      document: {
        open: vi.fn(),
        write,
        close: vi.fn(),
        readyState: "complete",
      },
      focus,
      print,
      close,
      addEventListener,
    };
    vi.stubGlobal("open", vi.fn(() => printWindow));

    const host = document.createElement("div");
    host.innerHTML = '<div class="pos-receipt"><div class="receipt-header"><h2>Sale Receipt</h2></div></div>';

    printReceiptContent(host, "INV-99");
    expect(write).toHaveBeenCalled();
    const written = write.mock.calls.map((c) => String(c[0])).join("");
    expect(written).toContain("Receipt - INV-99");
    expect(written).toContain(".receipt-header");
    expect(written).toContain("Sale Receipt");

    vi.runAllTimers();
    expect(print).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();

    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
