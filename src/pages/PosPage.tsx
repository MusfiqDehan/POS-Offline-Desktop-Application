import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { PosCashRegisterModal } from "@/components/pos/PosCashRegisterModal";
import { PosCreateCustomerModal } from "@/components/pos/PosCreateCustomerModal";
import { PosHeader } from "@/components/pos/PosHeader";
import { PosManageCategoriesModal } from "@/components/pos/PosManageCategoriesModal";
import { PosOrderDetails } from "@/components/pos/PosOrderDetails";
import { PosOrderSidebar } from "@/components/pos/PosOrderSidebar";
import { PosProductsPanel } from "@/components/pos/PosProductsPanel";
import { PosCheckoutDialog, PosReceiptDialog } from "@/components/pos/PosSaleModals";
import { PosScannerPanel } from "@/components/pos/PosScannerPanel";
import { PosTodaySaleModal } from "@/components/pos/PosTodaySaleModal";
import { usePosCart } from "@/hooks/usePosCart";
import { usePosCategories } from "@/hooks/usePosCategories";
import { usePosProducts } from "@/hooks/usePosProducts";
import { getAccessToken } from "@/lib/auth-session";
import { fetchPosConfig } from "@/lib/pos-api";
import { apiRowToPosProduct } from "@/lib/posProductMapping";
import {
  playScanSound,
  scanAddedMessage,
  scanNotFoundMessage,
  scanOutOfStockMessage,
  scanStockLimitMessage,
} from "@/lib/posScanFeedback";
import { useActiveBranch } from "@/providers/branch-provider";
import { useSync } from "@/providers/sync-provider";

function scanFailureMessage(apiMessage: string): string {
  if (
    apiMessage === "Select a branch before scanning." ||
    apiMessage === "Enter a barcode or SKU to scan."
  ) {
    return apiMessage;
  }
  return scanNotFoundMessage();
}

export function PosPage() {
  const { activeBranch } = useActiveBranch();
  const { online, pullNow } = useSync();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [todayOpen, setTodayOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [scanSoundEnabled, setScanSoundEnabled] = useState(true);

  const cart = usePosCart();
  const categories = usePosCategories(activeTab, setActiveTab);
  const {
    products,
    loading: productsLoading,
    error: productsError,
    scanBarcode,
    reload: reloadProducts,
  } = usePosProducts(activeTab, searchQuery);

  useEffect(() => {
    if (!activeBranch || !online) return;
    let cancelled = false;
    void (async () => {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetchPosConfig(token, activeBranch.id);
      if (cancelled || !res.ok || !res.body.data) return;
      setScanSoundEnabled(res.body.data.scan_sound_enabled ?? true);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeBranch, online]);

  const handleBarcodeScan = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      try {
        const result = await scanBarcode(trimmed);
        if (!result.ok) {
          if (scanSoundEnabled) playScanSound("error");
          cart.showStatus(scanFailureMessage(result.message));
          return;
        }

        const product = apiRowToPosProduct(result.row);
        const added = cart.addProduct(product, { quiet: true });
        if (added) {
          if (scanSoundEnabled) playScanSound("success");
          cart.showStatus(scanAddedMessage(product.name));
          return;
        }

        if (scanSoundEnabled) playScanSound("error");
        cart.showStatus(
          product.stockStatus === "out-of-stock"
            ? scanOutOfStockMessage(product.name)
            : scanStockLimitMessage(product.name),
        );
      } catch {
        if (scanSoundEnabled) playScanSound("error");
        cart.showStatus("Scan failed. Check your connection and try again.");
      }
    },
    [cart, scanBarcode, scanSoundEnabled],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        void cart.holdOrder();
      }
      if (e.key === "F3") {
        e.preventDefault();
        cart.startNewOrder();
      }
      if (e.key === "F4" && cart.canCheckout) {
        e.preventDefault();
        setCheckoutOpen(true);
      }
      if (e.key === "F9" && cart.receiptSnapshot) {
        e.preventDefault();
        setReceiptOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cart]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background p-6">
      <PosHeader
        onOpenCashRegister={() => setCashOpen(true)}
        onOpenTodaySale={() => setTodayOpen(true)}
      />

      {!online && (
        <Alert variant="warning" className="mb-3">
          Offline — sales will sync when connected.
        </Alert>
      )}

      {productsError && (
        <Alert variant="warning" className="mb-3">
          {productsError}
        </Alert>
      )}

      {cart.statusMessage && (
        <output
          className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded bg-toast px-4 py-2.5 text-center text-[13px] font-medium text-white shadow-lg"
          role="status"
        >
          {cart.statusMessage}
        </output>
      )}

      {!activeBranch && (
        <output
          className="pointer-events-none fixed left-1/2 top-36 z-50 -translate-x-1/2 rounded bg-toast-warning px-4 py-2.5 text-center text-[13px] font-medium text-white shadow-lg"
          role="status"
        >
          Select a branch in the header before scanning products.
        </output>
      )}

      <PosScannerPanel onBarcodeScan={(code) => void handleBarcodeScan(code)} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:grid-cols-[689fr_370fr_330fr]">
        <PosProductsPanel
          categories={categories.categories}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          products={products}
          productsLoading={productsLoading}
          cartProductIds={cart.cartProductIds}
          onProductSelect={cart.addProduct}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBarcodeScan={(code) => void handleBarcodeScan(code)}
        />
        <PosOrderDetails
          items={cart.items}
          onDecrease={cart.decreaseQuantity}
          onIncrease={cart.increaseQuantity}
          onRemove={cart.removeItem}
          onClearAll={cart.clearCart}
        />
        <div className="lg:col-span-2 xl:col-span-1">
          <PosOrderSidebar
            invoiceId={cart.invoiceId}
            customers={cart.customers}
            selectedCustomerId={cart.selectedCustomerId}
            onSelectCustomer={cart.setSelectedCustomerId}
            paymentMethods={cart.paymentMethods}
            selectedPaymentId={cart.selectedPaymentId}
            onSelectPayment={cart.setSelectedPaymentId}
            subtotal={cart.subtotal}
            tax={cart.tax}
            totalPayable={cart.totalPayable}
            canCheckout={cart.canCheckout}
            onHold={() => void cart.holdOrder()}
            onNew={cart.startNewOrder}
            onClear={cart.clearCart}
            onPay={() => setCheckoutOpen(true)}
            onCreateCustomer={() => setCustomerOpen(true)}
            heldOrders={cart.heldOrders}
            onRecallHeld={(id) => void cart.recallHeldOrder(id)}
            onManageCategories={() => setCategoriesOpen(true)}
          />
        </div>
      </div>

      <PosCreateCustomerModal
        open={customerOpen}
        onOpenChange={setCustomerOpen}
        onCreate={cart.createCustomer}
      />
      <PosManageCategoriesModal
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
        categories={categories.categories}
        onCreated={() => {
          void pullNow();
          void categories.refresh();
          void reloadProducts();
        }}
      />
      <PosCashRegisterModal open={cashOpen} onOpenChange={setCashOpen} />
      <PosTodaySaleModal open={todayOpen} onOpenChange={setTodayOpen} />
      <PosCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        totalPayable={cart.totalPayable}
        onConfirm={async () => {
          const ok = await cart.completeOrder();
          if (ok) setReceiptOpen(true);
        }}
      />
      <PosReceiptDialog
        open={receiptOpen}
        onOpenChange={(open) => {
          setReceiptOpen(open);
          if (!open) cart.clearReceiptSnapshot();
        }}
        receipt={cart.receiptSnapshot}
      />
    </div>
  );
}
