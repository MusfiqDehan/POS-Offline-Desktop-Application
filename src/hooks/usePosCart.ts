import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency, parseCurrency } from "@/lib/currency";
import { getPosRepository } from "@/lib/db";
import {
  createPosCustomer,
  fetchPaymentMethods,
  fetchPosConfig,
  fetchPosCustomers,
} from "@/lib/pos-api";
import type { CheckoutPayload, PaymentMethod, PosCustomer } from "@/lib/pos-types";
import { apiRowToPosProduct, buildCartLineKey, type PosProduct } from "@/lib/posProductMapping";
import { extractListItems } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-session";
import { resolvePaymentMethodsLoad } from "@/lib/paymentMethodsLoad";
import { extractReceiptRender } from "@/lib/posReceiptUtils";
import { getTenantSubdomain } from "@/lib/tenant-headers";
import { randomUUID } from "@/lib/uuid";
import { useActiveBranch } from "@/providers/branch-provider";
import { useSync } from "@/providers/sync-provider";

export type CartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  packageId: string | null;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stockMax: number;
};

export type ReceiptSnapshot = {
  invoiceId: string;
  totalPayable: number;
  paymentLabel: string;
  saleId?: string;
  receipt?: unknown;
  receiptRender?: string;
};

export function usePosCart() {
  const { activeBranch } = useActiveBranch();
  const { online, engine } = useSync();
  const [items, setItems] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [receiptSnapshot, setReceiptSnapshot] = useState<ReceiptSnapshot | null>(null);
  const [invoiceSeq, setInvoiceSeq] = useState(3001);
  const [taxRate, setTaxRate] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!activeBranch) return;
      const tenant = getTenantSubdomain();
      const repo = await getPosRepository();
      const token = getAccessToken();
      const cachedMethods = (await repo.listPaymentMethods(
        tenant,
        activeBranch.id,
      )) as PaymentMethod[];

      let methodsResOk = false;
      let methodsApiData: unknown;

      if (online && token) {
        const [configRes, customersRes, methodsRes] = await Promise.all([
          fetchPosConfig(token, activeBranch.id),
          fetchPosCustomers({ branch: activeBranch.id }, token),
          fetchPaymentMethods({ active: true }, token),
        ]);

        if (configRes.ok && configRes.body.data) {
          const cfg = configRes.body.data;
          const rate = Number.parseFloat(cfg.tax_rate);
          setTaxRate(Number.isNaN(rate) ? 0 : rate);
          setTaxEnabled(cfg.tax_enabled ?? true);
          await repo.savePosConfig(tenant, activeBranch.id, cfg);
        } else {
          const cfg = await repo.getPosConfig(tenant, activeBranch.id);
          if (cfg && typeof cfg === "object") {
            const c = cfg as { tax_rate?: string; tax_enabled?: boolean };
            const rate = Number.parseFloat(c.tax_rate ?? "0");
            setTaxRate(Number.isNaN(rate) ? 0 : rate);
            setTaxEnabled(c.tax_enabled ?? true);
          }
        }

        if (customersRes.ok && customersRes.body.data) {
          const list = extractListItems<PosCustomer>(customersRes.body.data);
          setCustomers(list);
          await repo.upsertCustomers(tenant, activeBranch.id, list);
        } else {
          setCustomers(await repo.listCustomers(tenant, activeBranch.id));
        }

        methodsResOk = methodsRes.ok;
        methodsApiData = methodsRes.body.data;
      } else {
        setCustomers(await repo.listCustomers(tenant, activeBranch.id));
        const cfg = await repo.getPosConfig(tenant, activeBranch.id);
        if (cfg && typeof cfg === "object") {
          const c = cfg as { tax_rate?: string; tax_enabled?: boolean };
          const rate = Number.parseFloat(c.tax_rate ?? "0");
          setTaxRate(Number.isNaN(rate) ? 0 : rate);
          setTaxEnabled(c.tax_enabled ?? true);
        }
      }

      const resolved = resolvePaymentMethodsLoad({
        online: Boolean(online && token),
        apiOk: methodsResOk,
        apiData: methodsApiData,
        cachedMethods,
      });

      if (resolved.shouldPersist) {
        await repo.upsertPaymentMethods(tenant, activeBranch.id, resolved.methods);
      }
      setPaymentMethods(resolved.methods);
      const firstId = resolved.methods[0]?.id;
      if (firstId) {
        setSelectedPaymentId((prev) =>
          prev && resolved.methods.some((m) => m.id === prev) ? prev : firstId,
        );
      }
    })();
  }, [activeBranch, online]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
  }, []);

  const addProduct = useCallback(
    (product: PosProduct, opts?: { quiet?: boolean }) => {
      if (product.stockStatus === "out-of-stock") {
        if (!opts?.quiet) showStatus(`${product.name} is out of stock`);
        return false;
      }
      const stockMax = Number.parseFloat(product.stockLabel) || 999;
      const existing = items.find((i) => i.id === product.id);
      if (existing && existing.quantity >= stockMax) {
        if (!opts?.quiet) showStatus(`${product.name} stock limit reached`);
        return false;
      }

      setItems((prev) => {
        const current = prev.find((i) => i.id === product.id);
        if (current) {
          if (current.quantity >= stockMax) return prev;
          return prev.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            productId: product.productId,
            variantId: product.variantId,
            packageId: product.packageId,
            name: product.name,
            sku: product.sku,
            price: parseCurrency(product.price),
            quantity: 1,
            stockMax,
          },
        ];
      });
      if (!opts?.quiet) showStatus(`Added ${product.name}`);
      return true;
    },
    [items, showStatus],
  );

  const increaseQuantity = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id && i.quantity < i.stockMax ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    );
  }, []);

  const decreaseQuantity = useCallback((id: string) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );
  const effectiveTaxRate = taxEnabled ? taxRate : 0;
  const tax = subtotal * effectiveTaxRate;
  const totalPayable = subtotal + tax;
  const canCheckout = items.length > 0 && Boolean(selectedPaymentId);

  const startNewOrder = useCallback(() => {
    setItems([]);
    setSelectedCustomerId(null);
    setInvoiceSeq((s) => s + 1);
    showStatus("Started new order");
  }, [showStatus]);

  const [heldOrders, setHeldOrders] = useState<
    Array<{ id: string; label: string; created_at: string }>
  >([]);

  const refreshHeldOrders = useCallback(async () => {
    if (!activeBranch) {
      setHeldOrders([]);
      return;
    }
    const repo = await getPosRepository();
    const rows = await repo.listHeldOrders(getTenantSubdomain(), activeBranch.id);
    setHeldOrders(rows.map((r) => ({ id: r.id, label: r.label, created_at: r.created_at })));
  }, [activeBranch]);

  useEffect(() => {
    void refreshHeldOrders();
  }, [refreshHeldOrders]);

  const holdOrder = useCallback(async () => {
    if (!activeBranch || items.length === 0) return;
    const repo = await getPosRepository();
    await repo.saveHeldOrder({
      id: randomUUID(),
      branch_id: activeBranch.id,
      tenant_subdomain: getTenantSubdomain(),
      label: `Hold #${invoiceSeq}`,
      payload_json: JSON.stringify({ items, selectedCustomerId, selectedPaymentId }),
      created_at: new Date().toISOString(),
    });
    setItems([]);
    await refreshHeldOrders();
    showStatus("Order held");
  }, [
    activeBranch,
    items,
    invoiceSeq,
    selectedCustomerId,
    selectedPaymentId,
    showStatus,
    refreshHeldOrders,
  ]);

  const recallHeldOrder = useCallback(
    async (heldId: string) => {
      if (!activeBranch) return;
      const repo = await getPosRepository();
      const rows = await repo.listHeldOrders(getTenantSubdomain(), activeBranch.id);
      const row = rows.find((r) => r.id === heldId);
      if (!row) {
        showStatus("Held order not found");
        return;
      }
      const payload = JSON.parse(row.payload_json) as {
        items: CartItem[];
        selectedCustomerId: string | null;
        selectedPaymentId: string | null;
      };
      setItems(payload.items ?? []);
      setSelectedCustomerId(payload.selectedCustomerId ?? null);
      if (payload.selectedPaymentId) setSelectedPaymentId(payload.selectedPaymentId);
      await repo.deleteHeldOrder(heldId);
      await refreshHeldOrders();
      showStatus(`Recalled ${row.label}`);
    },
    [activeBranch, showStatus, refreshHeldOrders],
  );

  const completeOrder = useCallback(async () => {
    if (!activeBranch || !selectedPaymentId || items.length === 0) return false;

    // Checkout API validates payments[].method as PaymentMethod.code (e.g. "cash"),
    // not the row UUID — match web POS usePosCart behavior.
    const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentId);
    const paymentCode = selectedMethod?.code ?? selectedPaymentId;
    const paymentLabel = selectedMethod?.label ?? "Payment";

    const payload: CheckoutPayload = {
      branch: activeBranch.id,
      customer: selectedCustomerId,
      lines: items.map((i) => ({
        product: i.productId,
        quantity: i.quantity,
        variant: i.variantId,
        package: i.packageId,
      })),
      payments: [{ method: paymentCode, amount: totalPayable.toFixed(2) }],
      idempotency_key: randomUUID(),
      promotions: [],
      coupons: [],
      vouchers: [],
    };

    const invoiceId = `INV-${invoiceSeq}`;

    if (online) {
      const res = await engine.checkoutOnline(payload);
      if (!res.ok) {
        showStatus(res.body.message ?? "Checkout failed");
        return false;
      }
      const sale = res.body.data;
      setReceiptSnapshot({
        invoiceId: sale?.ref_number ?? invoiceId,
        totalPayable,
        paymentLabel,
        saleId: sale?.id,
        receipt: sale?.receipt,
        receiptRender: extractReceiptRender(sale?.receipt_render),
      });
    } else {
      await engine.checkoutOffline(activeBranch.id, payload);
      setReceiptSnapshot({ invoiceId, totalPayable, paymentLabel });
      showStatus("Sale queued for sync");
    }

    setItems([]);
    setInvoiceSeq((s) => s + 1);
    return true;
  }, [
    activeBranch,
    selectedPaymentId,
    paymentMethods,
    items,
    totalPayable,
    invoiceSeq,
    online,
    engine,
    selectedCustomerId,
    showStatus,
  ]);

  const createCustomer = useCallback(
    async (input: { name: string; phone: string; email?: string }) => {
      if (!activeBranch) return null;
      const tenant = getTenantSubdomain();
      const token = getAccessToken();

      if (online && token) {
        const res = await createPosCustomer(
          {
            name: input.name,
            phone: input.phone,
            email: input.email,
            branch: activeBranch.id,
            is_active: true,
          },
          token,
        );
        if (!res.ok || !res.body.data) {
          showStatus(res.body.message ?? "Failed to create customer");
          return null;
        }
        const customer = res.body.data;
        const repo = await getPosRepository();
        await repo.upsertCustomers(tenant, activeBranch.id, [customer]);
        setCustomers((prev) => [...prev, customer]);
        setSelectedCustomerId(customer.id);
        showStatus(`Customer ${customer.name} added`);
        return customer;
      }

      const customer: PosCustomer = {
        id: randomUUID(),
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        branch: activeBranch.id,
        points: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      const repo = await getPosRepository();
      await repo.upsertCustomers(tenant, activeBranch.id, [customer]);
      setCustomers((prev) => [...prev, customer]);
      setSelectedCustomerId(customer.id);
      showStatus(`Customer ${customer.name} added (offline)`);
      return customer;
    },
    [activeBranch, online, showStatus],
  );

  return {
    items,
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    paymentMethods,
    selectedPaymentId,
    setSelectedPaymentId,
    statusMessage,
    showStatus,
    receiptSnapshot,
    clearReceiptSnapshot: () => setReceiptSnapshot(null),
    invoiceId: `INV-${invoiceSeq}`,
    addProduct,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    startNewOrder,
    holdOrder,
    recallHeldOrder,
    heldOrders,
    completeOrder,
    createCustomer,
    subtotal,
    tax,
    totalPayable,
    canCheckout,
    cartProductIds: new Set(items.map((i) => i.id)),
    formatCurrency,
  };
}

export { apiRowToPosProduct, buildCartLineKey };
