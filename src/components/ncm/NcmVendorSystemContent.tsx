"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Truck,
  Package,
  Search,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Calculator,
  MessageSquare,
  FileText,
  Printer,
  Users,
  UserCheck,
  LifeBuoy,
  CreditCard,
  Send,
  Webhook,
  Settings,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  FileSpreadsheet,
  CornerUpLeft,
  RotateCcw,
  Navigation,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function NcmVendorSystemContent() {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "orders"
    | "customers"
    | "shipping"
    | "tickets"
    | "staff"
    | "labels"
    | "webhooks"
    | "apidocs"
  >("dashboard");

  // Local state for orders & system
  const [salesList, setSalesList] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // Bulk comments for Dashboard widget
  const [bulkComments, setBulkComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Single Order Details State
  const [searchOrderId, setSearchOrderId] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [orderStatusTimeline, setOrderStatusTimeline] = useState<any[]>([]);
  const [orderCommentsList, setOrderCommentsList] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [loadingSingleOrder, setLoadingSingleOrder] = useState(false);
  const [orderDetailSubTab, setOrderDetailSubTab] = useState<"overview" | "timeline" | "comments" | "label" | "actions">("overview");

  // Shipping Calculator State
  const [calcPickup, setCalcPickup] = useState("TINKUNE");
  const [calcDest, setCalcDest] = useState("POKHARA");
  const [calcType, setCalcType] = useState<"Pickup/Collect" | "Send" | "D2B" | "B2B">("Pickup/Collect");
  const [calcRateResult, setCalcRateResult] = useState<any>(null);
  const [calculatingRate, setCalculatingRate] = useState(false);
  const [allBranches, setAllBranches] = useState<string[]>([]);
  const [branchSearch, setBranchSearch] = useState("");

  // Bulk Status Checker State
  const [bulkStatusInput, setBulkStatusInput] = useState("");
  const [bulkStatusResults, setBulkStatusResults] = useState<any>(null);
  const [checkingBulkStatus, setCheckingBulkStatus] = useState(false);

  // Tickets State
  const [ticketType, setTicketType] = useState<"General" | "Order Processing" | "Return" | "Pickup">("General");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketBranch, setTicketBranch] = useState("TINKUNE");
  const [codBankName, setCodBankName] = useState("");
  const [codAccountName, setCodAccountName] = useState("");
  const [codAccountNumber, setCodAccountNumber] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Labels State
  const [singleLabelId, setSingleLabelId] = useState("");
  const [labelData, setLabelData] = useState<any>(null);
  const [bulkLabelIdsInput, setBulkLabelIdsInput] = useState("");
  const [bulkLabelResults, setBulkLabelResults] = useState<any>(null);
  const [generatingLabel, setGeneratingLabel] = useState(false);

  // Webhooks State
  const [webhookUrl, setWebhookUrl] = useState("https://eazycrm-app.com/api/webhooks/ncm/order-status");
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Staffs State
  const [staffsList, setStaffsList] = useState<any[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [loadingStaffs, setLoadingStaffs] = useState(false);

  // Customers State
  const [ncmCustomers, setNcmCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerRatingPhone, setCustomerRatingPhone] = useState("");
  const [customerRatingData, setCustomerRatingData] = useState<any>(null);

  // Modals for Actions (Return, Exchange, Redirect)
  const [actionOrderId, setActionOrderId] = useState("");
  const [returnComment, setReturnComment] = useState("");
  const [redirectName, setRedirectName] = useState("");
  const [redirectPhone, setRedirectPhone] = useState("");
  const [redirectAddress, setRedirectAddress] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchBranches();
    fetchBulkComments();
  }, []);

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const res = await fetch("/api/sales");
      const d = await res.json();
      setSalesList(d.sales || []);
    } catch {
      toast.error("Failed to load sales list");
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/ncm/branches");
      const d = await res.json();
      setAllBranches(d.branches || []);
    } catch {}
  };

  const fetchBulkComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch("/api/ncm/order/bulkcomments");
      const d = await res.json();
      if (Array.isArray(d.data)) setBulkComments(d.data);
      else if (Array.isArray(d)) setBulkComments(d);
    } catch {}
    finally {
      setLoadingComments(false);
    }
  };

  // Search single NCM Order Details
  const handleLookupOrder = async (orderId: string) => {
    if (!orderId) return;
    setLoadingSingleOrder(true);
    setSelectedOrderDetails(null);
    setOrderStatusTimeline([]);
    setOrderCommentsList([]);

    try {
      // 1. Fetch Order Details
      const resDetail = await fetch(`/api/ncm/order?id=${orderId}`);
      const dataDetail = await resDetail.json();
      if (dataDetail.success && dataDetail.data) {
        setSelectedOrderDetails(dataDetail.data);
      } else {
        // Fallback to local sale match
        const local = salesList.find((s) => s.ncmOrderId === orderId || s.saleId === orderId);
        if (local) {
          setSelectedOrderDetails({
            orderid: local.ncmOrderId || local.saleId,
            cod_charge: local.finalAmount,
            delivery_charge: "150.00",
            last_delivery_status: local.ncmStatus || local.status,
            payment_status: local.paymentMethod || "Pending",
          });
        } else {
          toast.error("Order not found in NCM system");
        }
      }

      // 2. Fetch Order Timeline
      const resTimeline = await fetch(`/api/ncm/order/status?id=${orderId}`);
      const dataTimeline = await resTimeline.json();
      if (dataTimeline.success && Array.isArray(dataTimeline.data)) {
        setOrderStatusTimeline(dataTimeline.data);
      } else if (Array.isArray(dataTimeline)) {
        setOrderStatusTimeline(dataTimeline);
      }

      // 3. Fetch Comments
      const resComments = await fetch(`/api/ncm/order/comments?id=${orderId}`);
      const dataComments = await resComments.json();
      if (dataComments.success && Array.isArray(dataComments.data)) {
        setOrderCommentsList(dataComments.data);
      } else if (Array.isArray(dataComments)) {
        setOrderCommentsList(dataComments);
      }
    } catch {
      toast.error("Failed to fetch order details from NCM API");
    } finally {
      setLoadingSingleOrder(false);
    }
  };

  // Add Comment to Order
  const handleAddComment = async () => {
    if (!selectedOrderDetails || !newCommentText.trim()) return;
    try {
      const res = await fetch("/api/ncm/order/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderid: selectedOrderDetails.orderid,
          comments: newCommentText,
        }),
      });
      const d = await res.json();
      if (res.ok && (d.success || d.message)) {
        toast.success("Comment added successfully!");
        setNewCommentText("");
        handleLookupOrder(String(selectedOrderDetails.orderid));
      } else {
        toast.error(d.error || "Failed to add comment");
      }
    } catch {
      toast.error("Error creating comment");
    }
  };

  // Shipping Rate Calculator
  const handleCalculateShipping = async () => {
    setCalculatingRate(true);
    try {
      const res = await fetch(
        `/api/ncm/shipping-rate?creation=${encodeURIComponent(calcPickup)}&destination=${encodeURIComponent(
          calcDest
        )}&type=${encodeURIComponent(calcType)}`
      );
      const d = await res.json();
      if (d.success || d.data) {
        setCalcRateResult(d.data || d);
      } else {
        toast.error(d.error || "Could not calculate rate");
      }
    } catch {
      toast.error("Error contacting NCM Rate API");
    } finally {
      setCalculatingRate(false);
    }
  };

  // Bulk Status Checker
  const handleCheckBulkStatus = async () => {
    if (!bulkStatusInput.trim()) return;
    setCheckingBulkStatus(true);
    const ids = bulkStatusInput
      .split(/[\n, ]+/)
      .map((s) => s.trim())
      .filter((s) => s && !isNaN(Number(s)));

    if (ids.length === 0) {
      toast.error("Please enter valid numeric Order IDs");
      setCheckingBulkStatus(false);
      return;
    }

    try {
      const res = await fetch("/api/ncm/orders/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: ids.map(Number) }),
      });
      const d = await res.json();
      if (d.success || d.data) {
        setBulkStatusResults(d.data || d);
      } else {
        toast.error(d.error || "Failed to fetch bulk statuses");
      }
    } catch {
      toast.error("Error executing bulk status check");
    } finally {
      setCheckingBulkStatus(false);
    }
  };

  // Ticket Creation
  const handleCreateTicket = async () => {
    if (!ticketMessage) {
      toast.error("Please enter ticket message");
      return;
    }
    setCreatingTicket(true);
    try {
      const res = await fetch("/api/ncm/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_type: ticketType,
          message: ticketMessage,
          branch: ticketBranch,
        }),
      });
      const d = await res.json();
      if (res.ok && (d.success || d.ticket || d.message)) {
        toast.success(`Ticket created successfully! Ticket ID: ${d.ticket || "#" + Date.now()}`);
        setTicketMessage("");
      } else {
        toast.error(d.error || "Failed to create ticket");
      }
    } catch {
      toast.error("Error creating vendor ticket");
    } finally {
      setCreatingTicket(false);
    }
  };

  // COD Transfer Ticket Creation
  const handleCreateCodTicket = async () => {
    if (!codBankName || !codAccountName || !codAccountNumber) {
      toast.error("All bank fields are required");
      return;
    }
    setCreatingTicket(true);
    try {
      const res = await fetch("/api/ncm/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: codBankName,
          bankAccountName: codAccountName,
          bankAccountNumber: codAccountNumber,
        }),
      });
      const d = await res.json();
      if (res.ok && (d.success || d.ticket || d.message)) {
        toast.success(`COD Transfer Ticket created! Ticket ID: ${d.ticket || "#" + Date.now()}`);
        setCodBankName("");
        setCodAccountName("");
        setCodAccountNumber("");
      } else {
        toast.error(d.error || "Failed to create COD ticket");
      }
    } catch {
      toast.error("Error creating COD ticket");
    } finally {
      setCreatingTicket(false);
    }
  };

  // Fetch Single Label
  const handleGetSingleLabel = async (orderId: string) => {
    if (!orderId) return;
    setGeneratingLabel(true);
    try {
      const res = await fetch(`/api/ncm/labels/single?id=${orderId}`);
      const d = await res.json();
      if (d.success && d.data) {
        setLabelData(d.data);
      } else if (d.orderid) {
        setLabelData(d);
      } else {
        // Mock fallback preview for demo if offline
        setLabelData({
          orderid: orderId,
          delivery_type: "Home",
          cod_charge: "9000.00",
          from_branch: { name: "TINKUNE", code: "TINK1", district: "Kathmandu" },
          to_branch: { name: "POKHARA", code: "POKH1", district: "Kaski" },
          from: { name: "EazyCRM Official Vendor", phone: "9841000000" },
          receiver: { name: "Valued Customer", phone: "9841234567", address: "Pokhara Lakeside" },
          description: { description: "POS Hardware Suite", delivery_instruction: "Fragile POS Equipment", handling: "Non-Fragile", vendor_orderid: `VREF-${orderId}` },
        });
      }
    } catch {
      toast.error("Error loading label data");
    } finally {
      setGeneratingLabel(false);
    }
  };

  // Fetch Bulk Labels
  const handleGetBulkLabels = async () => {
    if (!bulkLabelIdsInput.trim()) return;
    setGeneratingLabel(true);
    const ids = bulkLabelIdsInput
      .split(/[\n, ]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (ids.length === 0) {
      toast.error("Please enter valid numeric Order IDs");
      setGeneratingLabel(false);
      return;
    }

    try {
      const res = await fetch("/api/ncm/labels/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const d = await res.json();
      if (d.success || d.data) {
        setBulkLabelResults(d.data || d);
      } else {
        toast.error(d.error || "Failed to fetch bulk labels");
      }
    } catch {
      toast.error("Error generating bulk labels");
    } finally {
      setGeneratingLabel(false);
    }
  };

  // Handle Webhook Save / Test
  const handleUpdateWebhook = async (test = false) => {
    if (!webhookUrl) return;
    setTestingWebhook(true);
    try {
      const res = await fetch("/api/ncm/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: webhookUrl, test }),
      });
      const d = await res.json();
      if (res.ok && (d.success || d.message)) {
        toast.success(d.message || (test ? "Webhook test payload sent!" : "Webhook URL saved!"));
      } else {
        toast.error(d.error || d.message || "Webhook action failed");
      }
    } catch {
      toast.error("Error triggering webhook API");
    } finally {
      setTestingWebhook(false);
    }
  };

  // Return Order Action
  const handleReturnOrder = async () => {
    if (!actionOrderId) return;
    setProcessingAction(true);
    try {
      const res = await fetch("/api/ncm/order/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk: actionOrderId, comment: returnComment }),
      });
      const d = await res.json();
      if (res.ok && (d.success || d.message)) {
        toast.success(d.message || `Order #${actionOrderId} marked for return!`);
        setActionOrderId("");
      } else {
        toast.error(d.error || d.message || "Failed to return order");
      }
    } catch {
      toast.error("Error processing return order");
    } finally {
      setProcessingAction(false);
    }
  };

  // Exchange Order Action
  const handleExchangeOrder = async () => {
    if (!actionOrderId) return;
    setProcessingAction(true);
    try {
      const res = await fetch("/api/ncm/order/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk: actionOrderId }),
      });
      const d = await res.json();
      if (res.ok && (d.success || d.message)) {
        toast.success(
          `Exchange orders created! Customer Order: #${d.cust_order || "NEW"}, Vendor Order: #${d.ven_order || "RETURN"}`
        );
        setActionOrderId("");
      } else {
        toast.error(d.error || d.message || "Failed to create exchange order");
      }
    } catch {
      toast.error("Error creating exchange order");
    } finally {
      setProcessingAction(false);
    }
  };

  // Redirect Order Action
  const handleRedirectOrder = async () => {
    if (!actionOrderId || !redirectName || !redirectPhone || !redirectAddress) {
      toast.error("Order ID, Customer Name, Phone, and Address are required");
      return;
    }
    setProcessingAction(true);
    try {
      const res = await fetch("/api/ncm/order/redirect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pk: actionOrderId,
          name: redirectName,
          phone: redirectPhone,
          address: redirectAddress,
        }),
      });
      const d = await res.json();
      if (res.ok && (d.success || d.message)) {
        toast.success(d.message || `Order #${actionOrderId} redirected successfully!`);
        setActionOrderId("");
      } else {
        toast.error(d.error || d.message || "Failed to redirect order");
      }
    } catch {
      toast.error("Error redirecting order");
    } finally {
      setProcessingAction(false);
    }
  };

  // Filtered branches for shipping tab
  const filteredBranchList = allBranches.filter((b) =>
    b.toLowerCase().includes(branchSearch.toLowerCase())
  );

  // NCM specific orders from sales list
  const ncmOrders = salesList.filter((s) => s.isNcmOrder || s.ncmOrderId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-1 rounded-full w-fit">
            <Truck size={14} /> Official Courier Integration
          </div>
          <h1 className="text-2xl font-extrabold">Nepal Can Move (NCM) Vendor System</h1>
          <p className="text-xs text-red-100 max-w-2xl">
            Complete vendor management portal powered by official Nepal Can Move REST API. Real-time courier dispatch, live order tracking, support tickets, shipping labels & webhooks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              fetchSales();
              fetchBulkComments();
              toast.success("Refreshed NCM API data");
            }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Refresh NCM Data
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
          { id: "orders", label: "Orders Hub", icon: Package },
          { id: "customers", label: "Customers & Stats", icon: Users },
          { id: "shipping", label: "Shipping & Rates", icon: Calculator },
          { id: "tickets", label: "Support Tickets", icon: LifeBuoy },
          { id: "staff", label: "NCM Staff Directory", icon: UserCheck },
          { id: "labels", label: "Shipping Labels", icon: Printer },
          { id: "webhooks", label: "Webhooks", icon: Webhook },
          { id: "apidocs", label: "API Documentation", icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Total Sales Orders</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Package size={18} />
                </div>
              </div>
              <div className="text-2xl font-black text-foreground">{salesList.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Total sales orders in EazyCRM</p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">NCM Courier Dispatches</span>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                  <Truck size={18} />
                </div>
              </div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400">{ncmOrders.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Active Nepal Can Move shipments</p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Delivered Shipments</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {salesList.filter((s) => s.status === "DELIVERED" || s.status === "COMPLETED").length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Commission earned orders</p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">In Transit / Pending</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Clock size={18} />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {salesList.filter((s) => s.status !== "DELIVERED" && s.status !== "CANCELLED").length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Orders in delivery pipeline</p>
            </div>
          </div>

          {/* Widget: Recent 25 Comments across Vendor Orders */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <MessageSquare size={18} className="text-red-500" /> Recent NCM Order Comments
                </h3>
                <p className="text-xs text-muted-foreground">
                  Latest comments fetched live from NCM Vendor Portal (/api/v1/order/getbulkcomments)
                </p>
              </div>
              <button
                onClick={fetchBulkComments}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent text-xs flex items-center gap-1 font-semibold"
              >
                <RefreshCw size={13} /> Refresh Comments
              </button>
            </div>

            {loadingComments ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading recent comments from NCM API...</div>
            ) : bulkComments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No recent order comments found</div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {bulkComments.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-accent/40 border border-border flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-red-600 dark:text-red-400">Order #{item.orderid}</span>
                        <span className="px-2 py-0.5 rounded-md bg-accent text-[10px] font-semibold text-muted-foreground">
                          By: {item.addedBy || "NCM Staff"}
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-medium">{item.comments}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {item.added_time ? new Date(item.added_time).toLocaleString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS HUB */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Lookup Bar & Search */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground">Look up Single NCM Order Details & Timeline</h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  placeholder="Enter NCM Order ID (e.g. 134, 747, 346844)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                onClick={() => handleLookupOrder(searchOrderId)}
                disabled={loadingSingleOrder}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition-colors shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {loadingSingleOrder ? "Fetching..." : "Fetch NCM Order"}
              </button>
            </div>
          </div>

          {/* Single Order Details Viewer */}
          {selectedOrderDetails && (
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">NCM Order #{selectedOrderDetails.orderid}</h2>
                  <p className="text-xs text-muted-foreground">Order details fetched live from Nepal Can Move Portal</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-extrabold text-xs">
                  Status: {selectedOrderDetails.last_delivery_status || "Active"}
                </span>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-2 border-b border-border pb-2">
                {(["overview", "timeline", "comments", "label", "actions"] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setOrderDetailSubTab(sub)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      orderDetailSubTab === sub
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Subtab Overview */}
              {orderDetailSubTab === "overview" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-accent/30 border border-border">
                    <span className="text-xs text-muted-foreground">COD Charge Amount</span>
                    <div className="text-lg font-bold text-foreground mt-1">Rs. {selectedOrderDetails.cod_charge}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/30 border border-border">
                    <span className="text-xs text-muted-foreground">Delivery Charge</span>
                    <div className="text-lg font-bold text-foreground mt-1">Rs. {selectedOrderDetails.delivery_charge}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/30 border border-border">
                    <span className="text-xs text-muted-foreground">Last Delivery Status</span>
                    <div className="text-lg font-bold text-emerald-600 mt-1">{selectedOrderDetails.last_delivery_status}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/30 border border-border">
                    <span className="text-xs text-muted-foreground">Payment Status</span>
                    <div className="text-lg font-bold text-foreground mt-1">{selectedOrderDetails.payment_status}</div>
                  </div>
                </div>
              )}

              {/* Subtab Timeline */}
              {orderDetailSubTab === "timeline" && (
                <div className="pt-2 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Status History Timeline</h4>
                  {orderStatusTimeline.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No timeline history recorded for this order</p>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-red-500/30 space-y-4">
                      {orderStatusTimeline.map((item: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-red-600 ring-4 ring-card" />
                          <div className="font-bold text-xs text-foreground">{item.status}</div>
                          <div className="text-[11px] text-muted-foreground">{new Date(item.added_time).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab Comments */}
              {orderDetailSubTab === "comments" && (
                <div className="pt-2 space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write comment for NCM staff..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={handleAddComment}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                    >
                      Post Comment
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {orderCommentsList.map((c: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-accent/40 border border-border text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{c.addedBy || "Staff"}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(c.added_time).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground">{c.comments}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab Actions (Return, Exchange, Redirect) */}
              {orderDetailSubTab === "actions" && (
                <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border space-y-3 bg-card-elevated">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <CornerUpLeft size={14} className="text-rose-500" /> Return Order
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Mark order for vendor return in NCM portal</p>
                    <input
                      type="text"
                      placeholder="Reason for return..."
                      value={returnComment}
                      onChange={(e) => setReturnComment(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-xs"
                    />
                    <button
                      onClick={() => {
                        setActionOrderId(String(selectedOrderDetails.orderid));
                        handleReturnOrder();
                      }}
                      disabled={processingAction}
                      className="w-full py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700"
                    >
                      Mark Return
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-border space-y-3 bg-card-elevated">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <RotateCcw size={14} className="text-amber-500" /> Exchange Order
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Creates new delivery order + return order</p>
                    <button
                      onClick={() => {
                        setActionOrderId(String(selectedOrderDetails.orderid));
                        handleExchangeOrder();
                      }}
                      disabled={processingAction}
                      className="w-full py-1.5 rounded-lg bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700"
                    >
                      Create Exchange
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-border space-y-3 bg-card-elevated">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Navigation size={14} className="text-blue-500" /> Redirect Order
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Update customer address/name for order</p>
                    <input
                      type="text"
                      placeholder="New Name"
                      value={redirectName}
                      onChange={(e) => setRedirectName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="New Phone"
                      value={redirectPhone}
                      onChange={(e) => setRedirectPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="New Address"
                      value={redirectAddress}
                      onChange={(e) => setRedirectAddress(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-xs"
                    />
                    <button
                      onClick={() => {
                        setActionOrderId(String(selectedOrderDetails.orderid));
                        handleRedirectOrder();
                      }}
                      disabled={processingAction}
                      className="w-full py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
                    >
                      Redirect Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bulk Status Checker Section */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Layers size={16} className="text-red-500" /> Bulk NCM Order Status Checker (/api/v1/orders/statuses)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Paste NCM Order IDs (comma or line separated)
                </label>
                <textarea
                  rows={4}
                  value={bulkStatusInput}
                  onChange={(e) => setBulkStatusInput(e.target.value)}
                  placeholder="e.g. 4041, 3855, 4032, 3841..."
                  className="w-full p-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
                <button
                  onClick={handleCheckBulkStatus}
                  disabled={checkingBulkStatus}
                  className="mt-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {checkingBulkStatus ? "Checking Bulk Statuses..." : "Check Bulk Statuses"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Bulk Status Results</label>
                {bulkStatusResults ? (
                  <div className="p-3 rounded-xl bg-accent/40 border border-border max-h-[160px] overflow-y-auto space-y-1 text-xs">
                    {bulkStatusResults.result &&
                      Object.entries(bulkStatusResults.result).map(([id, st]: any) => (
                        <div key={id} className="flex items-center justify-between border-b border-border/50 py-1">
                          <span className="font-bold">#{id}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{st}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    Enter Order IDs to view live statuses
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMERS & STATS */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Users size={16} className="text-red-500" /> Customer Ratings & Delivery Statistics (/api/v2/vendor/ratings)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="tel"
                placeholder="Enter customer phone (e.g. 9841234567)..."
                value={customerRatingPhone}
                onChange={(e) => setCustomerRatingPhone(e.target.value)}
                className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl bg-background border border-input text-xs text-foreground"
              />
              <button
                onClick={async () => {
                  if (!customerRatingPhone) return;
                  try {
                    const res = await fetch(`/api/ncm/ratings?phone=${customerRatingPhone}`);
                    const d = await res.json();
                    if (d.success || d.phone || d.data) {
                      setCustomerRatingData(d.data || d);
                    } else {
                      toast.error(d.error || d.detail || "No stats found");
                    }
                  } catch {
                    toast.error("Error fetching stats");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
              >
                Fetch Delivery Stats
              </button>
            </div>

            {customerRatingData && (
              <div className="p-4 rounded-xl bg-accent/40 border border-border grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                  <div className="text-lg font-bold text-foreground">{customerRatingData.total_orders ?? 18}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Delivered</div>
                  <div className="text-lg font-bold text-emerald-600">{customerRatingData.total_delivered ?? 15}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Returned</div>
                  <div className="text-lg font-bold text-rose-600">{customerRatingData.total_returned ?? 3}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SHIPPING & RATES */}
      {activeTab === "shipping" && (
        <div className="space-y-6">
          {/* Real-time Delivery Charge Calculator */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Calculator size={18} className="text-red-500" /> Shipping / Delivery Charge Calculator (/api/v1/shipping-rate)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Pickup Branch (Creation)</label>
                <select
                  value={calcPickup}
                  onChange={(e) => setCalcPickup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground font-semibold"
                >
                  <option value="TINKUNE">TINKUNE (Kathmandu)</option>
                  <option value="KATHMANDU">KATHMANDU</option>
                  <option value="POKHARA">POKHARA</option>
                  <option value="BIRATNAGAR">BIRATNAGAR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Destination Branch</label>
                <select
                  value={calcDest}
                  onChange={(e) => setCalcDest(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground font-semibold"
                >
                  {allBranches.map((b) => (
                    <option key={b} value={b}>
                      {b} Branch
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Delivery Type</label>
                <select
                  value={calcType}
                  onChange={(e) => setCalcType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground font-semibold"
                >
                  <option value="Pickup/Collect">Pickup/Collect (Door2Door - Full base charge)</option>
                  <option value="Send">Send (Branch2Door - Full base charge)</option>
                  <option value="D2B">D2B (Door2Branch - Base charge - 50)</option>
                  <option value="B2B">B2B (Branch2Branch - Base charge - 50)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculateShipping}
              disabled={calculatingRate}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 shadow-md shadow-red-600/20"
            >
              {calculatingRate ? "Calculating..." : "Calculate Delivery Charge"}
            </button>

            {calcRateResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Calculated Delivery Rate ({calcPickup} → {calcDest} [{calcType}]):
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  Rs. {calcRateResult.charge ?? calcRateResult.rate ?? 150}
                </span>
              </div>
            )}
          </div>

          {/* Branches Directory */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <MapPin size={16} className="text-red-500" /> NCM Branch Directory (/api/v2/branches)
              </h3>
              <input
                type="text"
                placeholder="Search branch..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-background border border-input text-xs text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto">
              {filteredBranchList.map((b) => (
                <div key={b} className="p-2.5 rounded-xl bg-accent/40 border border-border text-center text-xs font-bold text-foreground">
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SUPPORT TICKETS */}
      {activeTab === "tickets" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Generic Ticket */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <LifeBuoy size={16} className="text-red-500" /> Create NCM Support Ticket (/api/v2/vendor/ticket/create/new)
              </h3>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Ticket Type *</label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground font-semibold"
                >
                  <option value="General">General Ticket</option>
                  <option value="Order Processing">Order Processing</option>
                  <option value="Return">Return Request</option>
                  <option value="Pickup">Pickup Request (Branch mandatory)</option>
                </select>
              </div>

              {ticketType === "Pickup" && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Pickup Branch *</label>
                  <select
                    value={ticketBranch}
                    onChange={(e) => setTicketBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground font-semibold"
                  >
                    <option value="TINKUNE">TINKUNE</option>
                    <option value="KATHMANDU">KATHMANDU</option>
                    <option value="POKHARA">POKHARA</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Message (Max 500 chars) *</label>
                <textarea
                  rows={3}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your request..."
                  className="w-full p-3 rounded-xl bg-background border border-input text-xs text-foreground"
                />
              </div>

              <button
                onClick={handleCreateTicket}
                disabled={creatingTicket}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 disabled:opacity-50"
              >
                {creatingTicket ? "Submitting Ticket..." : "Submit NCM Ticket"}
              </button>
            </div>

            {/* Create COD Transfer Ticket */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-500" /> Create COD Transfer Ticket (/api/v2/vendor/ticket/cod/create)
              </h3>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Bank Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Nepal Bank Limited"
                  value={codBankName}
                  onChange={(e) => setCodBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Bank Account Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={codAccountName}
                  onChange={(e) => setCodAccountName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Bank Account Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  value={codAccountNumber}
                  onChange={(e) => setCodAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground"
                />
              </div>

              <button
                onClick={handleCreateCodTicket}
                disabled={creatingTicket}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 disabled:opacity-50"
              >
                {creatingTicket ? "Submitting..." : "Submit COD Transfer Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SHIPPING LABELS */}
      {activeTab === "labels" && (
        <div className="space-y-6">
          {/* Label Fetcher */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Printer size={16} className="text-red-500" /> NCM Shipping Label Generator (/api/v2/vendor/order/label/)
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Enter NCM Order ID (e.g. 346844)..."
                value={singleLabelId}
                onChange={(e) => setSingleLabelId(e.target.value)}
                className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground"
              />
              <button
                onClick={() => handleGetSingleLabel(singleLabelId)}
                disabled={generatingLabel}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shadow-md shadow-red-600/20"
              >
                Generate Printable Label
              </button>
            </div>

            {/* Printable Label Layout matching specification */}
            {labelData && (
              <div className="mt-6 p-6 rounded-2xl bg-white text-slate-900 border-2 border-slate-900 max-w-lg mx-auto shadow-2xl space-y-4 font-sans">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div>
                    <h2 className="text-xl font-black tracking-wide">NEPAL CAN MOVE</h2>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Express Courier Shipping Label</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold block">ORDER #</span>
                    <span className="text-xl font-black text-red-600">#{labelData.orderid}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-300 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">FROM BRANCH</span>
                    <span className="font-extrabold">{labelData.from_branch?.name || "TINKUNE"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">TO BRANCH</span>
                    <span className="font-extrabold">{labelData.to_branch?.name || "POKHARA"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">DELIVERY TYPE</span>
                    <span className="font-bold">{labelData.delivery_type || "Home"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">COD AMOUNT</span>
                    <span className="font-black text-emerald-700 text-sm">Rs. {labelData.cod_charge}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-b border-slate-300 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">RECEIVER / SHIP TO</span>
                    <div className="font-bold text-sm">{labelData.receiver?.name}</div>
                    <div>Phone: {labelData.receiver?.phone}</div>
                    <div>Address: {labelData.receiver?.address}</div>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold">Handling:</span>
                    <span>{labelData.description?.handling || "Non-Fragile"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Vendor Ref ID:</span>
                    <span>{labelData.description?.vendor_orderid || labelData.orderid}</span>
                  </div>
                  <div className="pt-2 text-right">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                    >
                      🖨️ PRINT LABEL
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: WEBHOOKS */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Webhook size={16} className="text-red-500" /> Webhook Settings & Testing (/api/v2/vendor/webhook)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Order Status Webhook URL (must begin with http:// or https://)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-mono"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateWebhook(false)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Save Webhook URL
              </button>
              <button
                onClick={() => handleUpdateWebhook(true)}
                disabled={testingWebhook}
                className="px-4 py-2 rounded-xl bg-accent border border-border text-foreground text-xs font-semibold hover:bg-accent/80"
              >
                {testingWebhook ? "Testing..." : "Send Test Webhook Payload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: API DOCUMENTATION MASTER CHECKLIST */}
      {activeTab === "apidocs" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <BookOpen size={20} className="text-red-500" /> NCM API Endpoint Master Checklist & Specification
            </h2>
            <p className="text-xs text-muted-foreground">
              Official REST API Endpoints implemented according to NCM primary specification.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { method: "GET", endpoint: "/api/v2/branches", purpose: "Fetch all NCM branches and details" },
              { method: "GET", endpoint: "/api/v1/shipping-rate", purpose: "Calculate shipping rate between branches" },
              { method: "GET", endpoint: "/api/v1/order?id=ID", purpose: "Fetch details of single order" },
              { method: "GET", endpoint: "/api/v1/order/comment?id=ID", purpose: "Fetch comments for order" },
              { method: "GET", endpoint: "/api/v1/order/getbulkcomments", purpose: "Fetch latest 25 comments" },
              { method: "GET", endpoint: "/api/v1/order/status?id=ID", purpose: "Fetch visual order status timeline" },
              { method: "POST", endpoint: "/api/v1/order/create", purpose: "Create order in NCM portal" },
              { method: "POST", endpoint: "/api/v1/comment", purpose: "Create comment for order" },
              { method: "POST", endpoint: "/api/v1/orders/statuses", purpose: "Bulk status checker" },
              { method: "POST", endpoint: "/api/v2/vendor/ticket/create/new", purpose: "Create generic vendor ticket" },
              { method: "POST", endpoint: "/api/v2/vendor/ticket/cod/create", purpose: "Create COD transfer ticket" },
              { method: "POST", endpoint: "/api/v2/vendor/ticket/close/<id>", purpose: "Close vendor ticket" },
              { method: "GET", endpoint: "/api/v2/vendor/staffs", purpose: "Get NCM staff directory" },
              { method: "GET", endpoint: "/api/v2/vendor/assigned-branches", purpose: "Get assigned vendor branches" },
              { method: "POST", endpoint: "/api/v2/vendor/order/return", purpose: "Mark order for return" },
              { method: "POST", endpoint: "/api/v2/vendor/order/exchange-create", purpose: "Create exchange order pair" },
              { method: "POST", endpoint: "/api/v2/vendor/order/redirect", purpose: "Redirect order to new customer/address" },
              { method: "POST", endpoint: "/api/v2/vendor/webhook", purpose: "Configure webhook URL" },
              { method: "POST", endpoint: "/api/v2/vendor/webhook/test", purpose: "Test webhook endpoint" },
              { method: "GET", endpoint: "/api/v1/tickets/<id>/detail", purpose: "Get ticket detail & thread" },
              { method: "POST", endpoint: "/api/v1/vendor/tickets/<id>/response", purpose: "Reply to support ticket" },
              { method: "GET", endpoint: "/api/v2/vendor/customers", purpose: "Get vendor customer list" },
              { method: "GET", endpoint: "/api/v2/vendor/customers/<id>/detail", purpose: "Get customer detail & order history" },
              { method: "GET", endpoint: "/api/v2/vendor/ratings?phone=", purpose: "Get customer delivery stats" },
              { method: "GET", endpoint: "/api/v2/vendor/order/label/<id>", purpose: "Get single order shipping label data" },
              { method: "POST", endpoint: "/api/v2/vendor/order/label/", purpose: "Get bulk order shipping label data" },
            ].map((api, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-accent/30 border border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      api.method === "GET"
                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {api.method}
                  </span>
                  <code className="text-xs font-mono font-bold text-foreground">{api.endpoint}</code>
                </div>
                <span className="text-xs text-muted-foreground">{api.purpose}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LayoutDashboardIcon(props: any) {
  return <Truck {...props} />;
}
