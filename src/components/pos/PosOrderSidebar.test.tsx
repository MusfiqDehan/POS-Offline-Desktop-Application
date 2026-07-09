import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PosOrderSidebar } from "@/components/pos/PosOrderSidebar";
import type { PaymentMethod } from "@/lib/pos-types";

const baseProps = {
  invoiceId: "#INV-3001",
  customers: [],
  selectedCustomerId: null,
  onSelectCustomer: () => {},
  selectedPaymentId: null,
  onSelectPayment: () => {},
  subtotal: 0,
  tax: 0,
  totalPayable: 0,
  canCheckout: false,
  onHold: () => {},
  onNew: () => {},
  onClear: () => {},
  onPay: () => {},
  onCreateCustomer: () => {},
};

function method(overrides: Partial<PaymentMethod> = {}): PaymentMethod {
  return {
    id: "pm-1",
    label: "Cash",
    code: "cash",
    gateway_slug: null,
    is_active: true,
    icon: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("PosOrderSidebar payment methods", () => {
  it("renders method labels when methods are present", () => {
    render(
      <PosOrderSidebar
        {...baseProps}
        paymentMethods={[method({ label: "Cash" }), method({ id: "pm-2", label: "Card", code: "card" })]}
        selectedPaymentId="pm-1"
      />,
    );
    expect(screen.getByRole("button", { name: "Cash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Card" })).toBeInTheDocument();
  });

  it("shows empty-state copy when no methods are available", () => {
    render(<PosOrderSidebar {...baseProps} paymentMethods={[]} />);
    expect(screen.getByText("No payment methods synced yet.")).toBeInTheDocument();
  });

  it("renders resolvable icon URLs next to the label", () => {
    const { container } = render(
      <PosOrderSidebar
        {...baseProps}
        paymentMethods={[
          method({
            label: "Cash",
            icon: "https://cdn.example.com/cash.png",
          }),
        ]}
        selectedPaymentId="pm-1"
      />,
    );
    const img = container.querySelector('img[src="https://cdn.example.com/cash.png"]');
    expect(img).not.toBeNull();
    expect(screen.getByRole("button", { name: /Cash/ })).toBeInTheDocument();
  });
});
