export type PosProductRow = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: string;
  available_stock: string;
  category_id: string | null;
  category_name: string;
  image: string;
  tax_type: string;
  unit_name: string;
  selling_type: string;
  entity_type: "product" | "variant" | "package";
  variant_id: string | null;
  package_id: string | null;
  unit_quantity: number;
};

export type PosCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  branch: string | null;
  points: number;
  is_active: boolean;
  created_at: string;
};

export type CreatePosCustomerPayload = {
  name: string;
  phone: string;
  email?: string;
  branch?: string;
  is_active?: boolean;
};

export type PaymentMethod = {
  id: string;
  label: string;
  code: string;
  gateway_slug: string | null;
  is_active: boolean;
  icon: string | null;
  created_at: string;
};

export type PosConfig = {
  tax_rate: string;
  tax_enabled: boolean;
  currency: string;
  loyalty_enabled: boolean;
  points_per_discount_percent: number;
  max_loyalty_discount_percent: number;
  points_per_currency_unit: string;
  min_subtotal_to_earn_points: string;
  low_stock_threshold: number;
  scan_sound_enabled: boolean;
};

export type CheckoutLine = {
  product: string;
  quantity: number;
  variant?: string | null;
  package?: string | null;
};

export type CheckoutPayment = {
  method: string;
  amount: string;
};

export type CheckoutPayload = {
  branch: string;
  customer?: string | null;
  lines: CheckoutLine[];
  payments: CheckoutPayment[];
  idempotency_key: string;
  promotions?: string[];
  coupons?: string[];
  vouchers?: string[];
};

export type SaleResponse = {
  id: string;
  ref_number: string;
  branch: string;
  customer: string | null;
  cashier: string;
  status: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  created_at: string;
  lines: unknown[];
  payments: unknown[];
  discounts: unknown[];
  receipt?: unknown;
  receipt_render?: unknown;
};

export type PosCategoryCounts = {
  total: number;
  by_category: Record<string, number>;
};

export type CashRegisterStatus = {
  branch_id: string;
  balance: string;
  opening_float: string;
  is_open: boolean;
  opened_at: string | null;
  cash_sales_today: string;
  recent_movements: unknown[];
};

export type PosTodaySummary = {
  branch_id: string;
  date: string;
  total_sales: string;
  transaction_count: number;
  items_sold: string;
  avg_order_value: string;
};

export type PosProductParams = {
  branch: string;
  search?: string;
  category?: string;
  barcode?: string;
  selling_type?: string;
  ids?: string;
  in_stock?: boolean;
  cursor?: string;
  page_size?: number;
};

export type PosCustomerParams = {
  branch?: string;
  search?: string;
  loyalty_only?: boolean;
  cursor?: string;
  page_size?: number;
};

export type OutboxStatus = "pending" | "synced" | "failed";

export type CheckoutOutboxRow = {
  id: string;
  idempotency_key: string;
  branch_id: string;
  tenant_subdomain: string;
  payload_json: string;
  status: OutboxStatus;
  error: string | null;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  branch_id: string;
  tenant_subdomain: string;
  name: string;
  slug: string;
  product_count: number;
};
