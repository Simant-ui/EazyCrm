export interface CommissionCalculationResult {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  unitCommission: number;
  totalCommission: number;
  roundOff: number;
  finalAmount: number;
}

export const EAZYBOX_PRICING = {
  DEFAULT_PRICE: 9000,
  DEFAULT_COMMISSION: 700,
  DISCOUNTED_PRICE: 8500,
  DISCOUNTED_COMMISSION: 500,
};

export function calculateCommission(
  quantity: number,
  sellingPrice: number,
  roundOff: number = 0
): CommissionCalculationResult {
  const qty = Math.max(1, Math.floor(quantity || 1));
  const price = Math.max(0, sellingPrice || 0);

  // Determine commission per unit based on business rules
  let unitCommission = EAZYBOX_PRICING.DEFAULT_COMMISSION;
  if (price < EAZYBOX_PRICING.DEFAULT_PRICE && price >= EAZYBOX_PRICING.DISCOUNTED_PRICE) {
    unitCommission = EAZYBOX_PRICING.DISCOUNTED_COMMISSION;
  } else if (price < EAZYBOX_PRICING.DISCOUNTED_PRICE) {
    // Proportional or minimum commission calculation for special discounts
    unitCommission = Math.max(300, Math.floor(price * 0.05));
  } else {
    // For price >= 9000
    unitCommission = EAZYBOX_PRICING.DEFAULT_COMMISSION;
  }

  const subtotal = qty * price;
  const totalCommission = qty * unitCommission;
  const finalAmount = subtotal + roundOff;

  return {
    unitPrice: price,
    quantity: qty,
    subtotal,
    unitCommission,
    totalCommission,
    roundOff,
    finalAmount,
  };
}

export type OrderStatus =
  | "NEW"
  | "CONTACTED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "FOLLOW-UP"
  | "CONFIRMED"
  | "CONVERTED"
  | "LOST";

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "info"; bgClass: string; textClass: string }
> = {
  NEW: { label: "New", variant: "info", bgClass: "bg-blue-500/10 dark:bg-blue-500/20", textClass: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900" },
  CONTACTED: { label: "Contacted", variant: "info", bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20", textClass: "text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900" },
  CONFIRMED: { label: "Confirmed", variant: "warning", bgClass: "bg-amber-500/10 dark:bg-amber-500/20", textClass: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900" },
  PROCESSING: { label: "Processing", variant: "warning", bgClass: "bg-amber-500/10 dark:bg-amber-500/20", textClass: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900" },
  SHIPPED: { label: "Shipped", variant: "info", bgClass: "bg-cyan-500/10 dark:bg-cyan-500/20", textClass: "text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900" },
  DELIVERED: { label: "Delivered", variant: "success", bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20", textClass: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" },
  COMPLETED: { label: "Completed", variant: "success", bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20", textClass: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" },
  CANCELLED: { label: "Cancelled", variant: "danger", bgClass: "bg-rose-500/10 dark:bg-rose-500/20", textClass: "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900" },
};

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  NEW: { label: "New", color: "#3B82F6", bgClass: "bg-blue-500/10 dark:bg-blue-500/20", textClass: "text-blue-600 dark:text-blue-400" },
  CONTACTED: { label: "Contacted", color: "#6366F1", bgClass: "bg-indigo-500/10 dark:bg-indigo-500/20", textClass: "text-indigo-600 dark:text-indigo-400" },
  INTERESTED: { label: "Interested", color: "#06B6D4", bgClass: "bg-cyan-500/10 dark:bg-cyan-500/20", textClass: "text-cyan-600 dark:text-cyan-400" },
  "FOLLOW-UP": { label: "Follow-up", color: "#F59E0B", bgClass: "bg-amber-500/10 dark:bg-amber-500/20", textClass: "text-amber-600 dark:text-amber-400" },
  CONFIRMED: { label: "Confirmed", color: "#8B5CF6", bgClass: "bg-purple-500/10 dark:bg-purple-500/20", textClass: "text-purple-600 dark:text-purple-400" },
  CONVERTED: { label: "Converted", color: "#10B981", bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20", textClass: "text-emerald-600 dark:text-emerald-400" },
  LOST: { label: "Lost", color: "#EF4444", bgClass: "bg-rose-500/10 dark:bg-rose-500/20", textClass: "text-rose-600 dark:text-rose-400" },
};
