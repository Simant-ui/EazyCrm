"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  X,
  ShoppingBag,
  User,
  DollarSign,
  Megaphone,
  ShieldCheck,
  Tag,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { calculateCommission } from "@/lib/business";
import { formatCurrency } from "@/lib/utils";

const addSaleSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerMobile: z.string().min(10, "Valid 10-digit mobile number required"),
  customerEmail: z.string().email("Invalid email format").or(z.literal("")),
  customerAddress: z.string().optional(),
  product: z.string().min(2, "Product name required"),
  quantity: z.number().min(1, "Minimum quantity is 1"),
  sellingPrice: z.number().min(100, "Valid price required"),
  roundOff: z.number().default(0),
  paymentMethod: z.string().min(1, "Select payment method"),
  source: z.string().default("Meta Ads"),
  campaign: z.string().default("Dashain Special Promo 2026"),
  adSet: z.string().optional(),
  ad: z.string().optional(),
  salespersonId: z.string().min(1, "Select salesperson"),
  status: z.string().default("CONFIRMED"),
  remark: z.string().optional(),

  // Nepal Can Move (NCM) Integration Fields
  createNcmOrder: z.boolean().default(false),
  ncmBranch: z.string().optional(),
  ncmPickupBranch: z.string().default("TINKUNE"),
  ncmDeliveryType: z.string().default("Door2Door"),
  ncmInstruction: z.string().optional(),
  ncmWeight: z.string().default("1"),
});

type AddSaleFormValues = z.infer<typeof addSaleSchema>;

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_NCM_BRANCHES = [
  "KATHMANDU",
  "POKHARA",
  "BIRATNAGAR",
  "BUTWAL",
  "BHARATPUR",
  "LALITPUR",
  "BHAKTAPUR",
  "DHARAN",
  "DANG",
  "NEPALGUNJ",
  "JANAKPUR",
  "ITAHARI",
  "BIRGUNJ",
  "HETAUDA",
  "PALPA",
  "BIRTAMODE",
  "SURKHET",
  "DHANGADHI",
  "TINKUNE",
];

export function AddSaleModal({ isOpen, onClose, onSuccess }: AddSaleModalProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedProdInfo, setSelectedProdInfo] = useState<any>(null);
  const [ncmBranches, setNcmBranches] = useState<string[]>(DEFAULT_NCM_BRANCHES);
  const [loading, setLoading] = useState(false);

  const form = useForm<AddSaleFormValues>({
    resolver: zodResolver(addSaleSchema),
    defaultValues: {
      customerName: "",
      customerMobile: "",
      customerEmail: "",
      customerAddress: "",
      product: "EazyBox POS Hardware Suite",
      quantity: 1,
      sellingPrice: 9000,
      roundOff: 0,
      paymentMethod: "eSewa / Khalti",
      source: "Meta Ads",
      campaign: "Dashain Special Promo 2026",
      adSet: "",
      ad: "",
      salespersonId: "",
      status: "CONFIRMED",
      remark: "",
      createNcmOrder: false,
      ncmBranch: "KATHMANDU",
      ncmPickupBranch: "TINKUNE",
      ncmDeliveryType: "Door2Door",
      ncmInstruction: "",
      ncmWeight: "1",
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = form;

  const watchedQty = watch("quantity") || 1;
  const watchedPrice = watch("sellingPrice") || 9000;
  const watchedRoundOff = watch("roundOff") || 0;
  const watchedProduct = watch("product");
  const watchedCreateNcm = watch("createNcmOrder");

  // Live calculated commission details
  const calc = calculateCommission(watchedQty, watchedPrice, watchedRoundOff);

  const [shippingChargeRate, setShippingChargeRate] = useState<number | null>(null);
  const [calculatingRate, setCalculatingRate] = useState(false);

  const watchedNcmBranch = watch("ncmBranch");
  const watchedNcmPickup = watch("ncmPickupBranch");
  const watchedNcmType = watch("ncmDeliveryType");

  useEffect(() => {
    // Fetch Team Members
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => {
        setTeamMembers(d.users || []);
        if (d.users && d.users.length > 0) {
          setValue("salespersonId", d.users[0]._id);
        }
      })
      .catch(() => {});

    // Fetch Products Catalog from MongoDB
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const prods = d.products || [];
        setProductsList(prods);
        if (prods.length > 0) {
          const firstProd = prods[0];
          setValue("product", firstProd.name);
          setValue("sellingPrice", firstProd.sellingPrice);
          setSelectedProdInfo(firstProd);
        }
      })
      .catch(() => {});

    // Fetch NCM Branches from NCM API proxy
    fetch("/api/ncm/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.branches && d.branches.length > 0) {
          setNcmBranches(d.branches);
          setValue("ncmBranch", d.branches[0]);
        }
      })
      .catch(() => {});
  }, [setValue]);

  // Live Shipping Rate calculation effect
  useEffect(() => {
    if (!watchedCreateNcm || !watchedNcmBranch || !watchedNcmPickup) return;

    setCalculatingRate(true);
    const ncmType = watchedNcmType === "Door2Door" ? "Pickup/Collect" : watchedNcmType === "Send" ? "Send" : watchedNcmType === "D2B" ? "D2B" : "B2B";

    fetch(`/api/ncm/shipping-rate?creation=${encodeURIComponent(watchedNcmPickup)}&destination=${encodeURIComponent(watchedNcmBranch)}&type=${encodeURIComponent(ncmType)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.charge !== undefined || d.data?.rate !== undefined || d.charge !== undefined) {
          const rateVal = Number(d.data?.charge ?? d.data?.rate ?? d.charge ?? 150);
          setShippingChargeRate(rateVal);
        } else if (typeof d.data === "number") {
          setShippingChargeRate(d.data);
        } else {
          setShippingChargeRate(150); // fallback delivery rate
        }
      })
      .catch(() => setShippingChargeRate(150))
      .finally(() => setCalculatingRate(false));
  }, [watchedCreateNcm, watchedNcmBranch, watchedNcmPickup, watchedNcmType]);

  // Handle Product selection change
  const handleProductSelect = (productName: string) => {
    setValue("product", productName);
    const found = productsList.find((p) => p.name === productName);
    if (found) {
      setSelectedProdInfo(found);
      setValue("sellingPrice", found.sellingPrice); // Auto-fill price from product catalog
    }
  };

  if (!isOpen) return null;

  const onSubmit = async (values: AddSaleFormValues) => {
    setLoading(true);
    try {
      const selectedMember = teamMembers.find((m) => m._id === values.salespersonId);

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          salespersonName: selectedMember ? selectedMember.name : "Sales Executive",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.sale.isNcmOrder && data.sale.ncmOrderId) {
          toast.success(
            `Sale #${data.sale.saleId} saved & Nepal Can Move Order #${data.sale.ncmOrderId} created automatically!`,
            { duration: 5000 }
          );
        } else if (data.sale.ncmStatus && data.sale.ncmStatus.startsWith("Failed")) {
          toast.warning(`Sale #${data.sale.saleId} saved, but NCM Order failed: ${data.sale.ncmStatus}`, {
            duration: 6000,
          });
        } else {
          toast.success(`Sale #${data.sale.saleId} created successfully!`);
        }

        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Unable to save sale");
      }
    } catch (e: any) {
      toast.error("Failed to create sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-elevated">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Create New Sale</h2>
              <p className="text-xs text-muted-foreground">Select product, calculate commission & create Nepal Can Move courier order.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">


          {/* Section 1: Customer */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User size={14} className="text-emerald-500" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Customer Name *</label>
                <input
                  type="text"
                  {...form.register("customerName")}
                  placeholder="e.g. Bishal Supermarket"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {errors.customerName && <p className="text-[11px] text-rose-500 mt-1">{errors.customerName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  {...form.register("customerMobile")}
                  placeholder="9841XXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {errors.customerMobile && <p className="text-[11px] text-rose-500 mt-1">{errors.customerMobile.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  {...form.register("customerEmail")}
                  placeholder="customer@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Store / Delivery Address *</label>
                <input
                  type="text"
                  {...form.register("customerAddress")}
                  placeholder="New Road, Kathmandu"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product & Dynamic Pricing */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package size={14} className="text-emerald-500" /> Select Product & Custom Sale Price
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-foreground mb-1">Select Product from Catalog *</label>
                <select
                  value={watchedProduct}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {productsList.length > 0 ? (
                    productsList.map((p) => (
                      <option key={p._id} value={p.name}>
                        {p.name} — Catalog Price: Rs. {p.sellingPrice.toLocaleString()} ({p.category})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="EazyBox POS Hardware Suite">EazyBox POS Hardware Suite (Rs. 9,000)</option>
                      <option value="EazyBox Compact Touch Terminal">EazyBox Compact Touch Terminal (Rs. 15,000)</option>
                      <option value="Thermal Receipt Printer 80mm">Thermal Receipt Printer 80mm (Rs. 4,500)</option>
                      <option value="Omnidirectional 2D Barcode Scanner">Omnidirectional 2D Barcode Scanner (Rs. 6,000)</option>
                    </>
                  )}
                </select>
                {selectedProdInfo && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                    <span>SKU: <strong className="text-foreground">{selectedProdInfo.sku}</strong></span>
                    <span>•</span>
                    <span>Catalog Base Price: <strong className="text-emerald-600 dark:text-emerald-400">Rs. {selectedProdInfo.sellingPrice.toLocaleString()}</strong></span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Quantity (Units) *</label>
                <input
                  type="number"
                  min="1"
                  {...form.register("quantity", { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Actual Selling Price / Unit (Rs.) *</label>
                <div className="space-y-1.5">
                  <input
                    type="number"
                    step="50"
                    {...form.register("sellingPrice", { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Auto-filled from catalog. Override if negotiated!
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Round Off / Discount (Rs.)</label>
                <input
                  type="number"
                  {...form.register("roundOff", { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Payment Method</label>
                <select
                  {...form.register("paymentMethod")}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="eSewa / Khalti">eSewa / Khalti Digital Wallet</option>
                  <option value="Fonepay QR">Fonepay QR Instant</option>
                  <option value="Bank Transfer">Bank Transfer (NABIL / Everest)</option>
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Order Status</label>
                <select
                  {...form.register("status")}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Nepal Can Move (NCM) Integration */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/5 to-card border border-red-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-500 text-white shadow-md shadow-red-500/20">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    Nepal Can Move (NCM) Courier Dispatch
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-extrabold text-[10px]">
                      NCM API Ready
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically create order in Nepal Can Move portal upon saving sale.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...form.register("createNcmOrder")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {watchedCreateNcm && (
              <div className="pt-3 border-t border-red-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                    <MapPin size={13} className="text-red-500" /> Destination Branch *
                  </label>
                  <select
                    {...form.register("ncmBranch")}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {ncmBranches.map((b) => (
                      <option key={b} value={b}>
                        {b} Branch
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Pickup Branch (Sender)</label>
                  <select
                    {...form.register("ncmPickupBranch")}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="TINKUNE">TINKUNE (Kathmandu)</option>
                    <option value="KATHMANDU">KATHMANDU Central</option>
                    <option value="POKHARA">POKHARA Hub</option>
                    <option value="BIRATNAGAR">BIRATNAGAR Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Delivery Type</label>
                  <select
                    {...form.register("ncmDeliveryType")}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Door2Door">Door2Door (Full Pickup & Door Delivery)</option>
                    <option value="Send">Branch2Door (Sender drops at branch, door delivery)</option>
                    <option value="D2B">Door2Branch (NCM picks, Customer collects at branch)</option>
                    <option value="B2B">Branch2Branch (Branch drop & collect)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Package Weight (KG)</label>
                  <input
                    type="text"
                    {...form.register("ncmWeight")}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1">Delivery Instructions for Courier</label>
                  <input
                    type="text"
                    {...form.register("ncmInstruction")}
                    placeholder="e.g. Call customer before delivery, Handle fragile POS hardware with care"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="sm:col-span-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                    <Truck size={14} /> Estimated NCM Delivery Charge ({watchedNcmPickup} → {watchedNcmBranch}):
                  </span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {calculatingRate ? "Calculating..." : shippingChargeRate !== null ? `Rs. ${shippingChargeRate}` : "Rs. 150"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Marketing Attribution */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Megaphone size={14} className="text-emerald-500" /> Marketing Attribution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Lead Source</label>
                <select
                  {...form.register("source")}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Meta Ads">Meta Ads (FB/IG)</option>
                  <option value="Google Search">Google Search</option>
                  <option value="TikTok Ads">TikTok Ads</option>
                  <option value="Direct Referral">Direct Referral / Organic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Campaign Name</label>
                <select
                  {...form.register("campaign")}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Dashain Special Promo 2026">Dashain Special Promo 2026</option>
                  <option value="Retail Merchants Lead Gen - Q3">Retail Merchants Lead Gen - Q3</option>
                  <option value="Restaurant POS Hardware Kit">Restaurant POS Hardware Kit</option>
                  <option value="Supermarket Hardware Bundle">Supermarket Hardware Bundle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Assignment & Remarks */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" /> Assignment & Remarks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Assigned Sales Executive *</label>
                <select
                  {...form.register("salespersonId")}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.role.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Order Remark / Notes</label>
                <input
                  type="text"
                  {...form.register("remark")}
                  placeholder="Special instructions or notes..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                "Saving & Processing..."
              ) : watchedCreateNcm ? (
                <>
                  <Truck size={15} /> Save Sale & Create NCM Order
                </>
              ) : (
                "Save Sale Order"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
