"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Trash2,
  X,
  ChevronDown,
  Columns,
  RefreshCw,
  ShoppingBag,
  Truck,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials, exportToCSV } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/business";
import { toast } from "sonner";
import { AddSaleModal } from "./AddSaleModal";

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

export function SalesPageContent() {
  const [sales, setSales] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [ncmBranches, setNcmBranches] = useState<string[]>(DEFAULT_NCM_BRANCHES);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [salespersonFilter, setSalespersonFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [campaignFilter, setCampaignFilter] = useState("ALL");

  // Table State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Modals
  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const [activeSaleDetail, setActiveSaleDetail] = useState<any | null>(null);

  // NCM Manual Dispatch Modal state
  const [dispatchNcmSale, setDispatchNcmSale] = useState<any | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("KATHMANDU");
  const [deliveryType, setDeliveryType] = useState("Door2Door");
  const [dispatching, setDispatching] = useState(false);

  // Live NCM status modal state
  const [liveStatusInfo, setLiveStatusInfo] = useState<any | null>(null);
  const [fetchingLiveStatus, setFetchingLiveStatus] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const [salesRes, teamRes, branchesRes] = await Promise.all([
        fetch("/api/sales").then((r) => r.json()),
        fetch("/api/team").then((r) => r.json()),
        fetch("/api/ncm/branches").then((r) => r.json()).catch(() => ({ branches: DEFAULT_NCM_BRANCHES })),
      ]);

      setSales(salesRes.sales || []);
      setTeamMembers(teamRes.users || []);
      if (branchesRes.branches && branchesRes.branches.length > 0) {
        setNcmBranches(branchesRes.branches);
        setSelectedBranch(branchesRes.branches[0]);
      }
    } catch (e) {
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filtered & Sorted Sales
  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) => {
        if (search) {
          const q = search.toLowerCase();
          const matches =
            sale.customerName.toLowerCase().includes(q) ||
            sale.customerMobile.includes(q) ||
            sale.saleId.toLowerCase().includes(q) ||
            sale.product.toLowerCase().includes(q) ||
            (sale.ncmOrderId && sale.ncmOrderId.includes(q));
          if (!matches) return false;
        }

        if (salespersonFilter !== "ALL" && sale.salespersonName !== salespersonFilter) {
          return false;
        }

        if (statusFilter !== "ALL" && sale.status !== statusFilter) {
          return false;
        }

        if (campaignFilter !== "ALL" && sale.campaign !== campaignFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === "createdAt") {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [sales, search, salespersonFilter, statusFilter, campaignFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const paginatedSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedSales.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedSales.map((s) => s._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const exportData = filteredSales.map((s) => ({
      SaleID: s.saleId,
      Customer: s.customerName,
      Mobile: s.customerMobile,
      Salesperson: s.salespersonName,
      Product: s.product,
      Quantity: s.quantity,
      Price: s.sellingPrice,
      Revenue: s.finalAmount,
      Commission: s.totalCommission,
      Status: s.status,
      IsNcmOrder: s.isNcmOrder ? "Yes" : "No",
      NcmOrderID: s.ncmOrderId || "-",
      NcmBranch: s.ncmBranch || "-",
      Campaign: s.campaign,
      Date: formatDate(s.createdAt),
    }));
    exportToCSV("EazyBox_Sales_Export", exportData);
    toast.success(`Exported ${exportData.length} sales to CSV`);
  };

  // Handle Manual Dispatch to Nepal Can Move
  const handleManualNcmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchNcmSale) return;

    setDispatching(true);
    try {
      const res = await fetch("/api/ncm/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: dispatchNcmSale.saleId,
          destinationBranch: selectedBranch,
          deliveryType: deliveryType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Nepal Can Move Order #${data.orderid} created successfully!`);
        setDispatchNcmSale(null);
        if (activeSaleDetail && activeSaleDetail.saleId === dispatchNcmSale.saleId) {
          setActiveSaleDetail({
            ...activeSaleDetail,
            ...data.ncmData,
            status: "SHIPPED",
          });
        }
        fetchSales();
      } else {
        toast.error(data.error || "Failed to create NCM order");
      }
    } catch (e: any) {
      toast.error("Error creating Nepal Can Move order");
    } finally {
      setDispatching(false);
    }
  };

  // Fetch Live NCM Status
  const handleCheckLiveNcmStatus = async (ncmOrderId: string) => {
    setFetchingLiveStatus(true);
    try {
      const res = await fetch(`/api/ncm/order?ncmOrderId=${ncmOrderId}`);
      const data = await res.json();
      if (res.ok) {
        setLiveStatusInfo(data);
      } else {
        toast.error(data.error || "Unable to fetch live status");
      }
    } catch (e) {
      toast.error("Failed to connect to NCM API");
    } finally {
      setFetchingLiveStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Sales Orders
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1">
              <Truck size={13} /> Nepal Can Move Integrated
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage hardware sales, calculate commissions & dispatch orders via Nepal Can Move API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground font-semibold text-xs hover:bg-accent transition-colors shadow-sm"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={() => setAddSaleOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} /> Add Sale
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sale ID, customer name, mobile, NCM Order ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Salesperson Filter */}
          <select
            value={salespersonFilter}
            onChange={(e) => setSalespersonFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Salespeople</option>
            {teamMembers.map((m) => (
              <option key={m._id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Clear Filters Button */}
          <button
            onClick={() => {
              setSearch("");
              setSalespersonFilter("ALL");
              setStatusFilter("ALL");
              setCampaignFilter("ALL");
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
          >
            <X size={14} /> Clear Filters
          </button>
        </div>
      </div>

      {/* Desktop Data Table / Mobile Card Layout */}
      <div className="p-4 md:p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        {/* Bulk Action Header */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
            <span className="font-semibold text-primary">{selectedIds.length} Sales selected</span>
            <button
              onClick={handleExport}
              className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              Export Selected
            </button>
          </div>
        )}

        {/* Table View (Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedSales.length && paginatedSales.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                </th>
                <th className="py-3 px-3">Sale ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Salesperson</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Revenue</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">NCM Courier</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
                    No sales found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => {
                  const cfg = ORDER_STATUS_CONFIG[sale.status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.CONFIRMED;
                  const isSelected = selectedIds.includes(sale._id);

                  return (
                    <tr
                      key={sale._id}
                      className={`hover:bg-accent/40 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(sale._id)}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="py-3 px-3 font-bold text-primary">{sale.saleId}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-accent text-foreground font-bold text-[10px] flex items-center justify-center shrink-0">
                            {getInitials(sale.customerName)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{sale.customerName}</div>
                            <div className="text-[10px] text-muted-foreground">{sale.customerMobile}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-medium">{sale.salespersonName}</td>
                      <td className="py-3 px-3 text-center font-bold text-foreground">{sale.quantity}</td>
                      <td className="py-3 px-3 text-muted-foreground">{formatCurrency(sale.sellingPrice)}</td>
                      <td className="py-3 px-3 font-extrabold text-foreground">{formatCurrency(sale.finalAmount)}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bgClass} ${cfg.textClass}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {sale.isNcmOrder && sale.ncmOrderId ? (
                          <button
                            onClick={() => handleCheckLiveNcmStatus(sale.ncmOrderId)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-extrabold text-[10px] hover:bg-red-500/20 transition-colors"
                            title="Click to view live NCM status"
                          >
                            <Truck size={11} /> NCM #{sale.ncmOrderId} ({sale.ncmBranch || "Hub"})
                          </button>
                        ) : (
                          <button
                            onClick={() => setDispatchNcmSale(sale)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent hover:bg-red-500/10 hover:text-red-500 text-[10px] text-muted-foreground font-semibold transition-colors border border-border"
                          >
                            <Plus size={10} /> Create NCM Order
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActiveSaleDetail(sale)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="View Detail"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3">
          {paginatedSales.map((sale) => {
            const cfg = ORDER_STATUS_CONFIG[sale.status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.CONFIRMED;
            return (
              <div key={sale._id} className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary text-sm">{sale.saleId}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bgClass} ${cfg.textClass}`}>
                    {cfg.label}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-foreground">{sale.customerName}</div>
                  <div className="text-xs text-muted-foreground">{sale.customerMobile} · Rep: {sale.salespersonName}</div>
                </div>

                {sale.isNcmOrder && sale.ncmOrderId ? (
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs flex items-center justify-between">
                    <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1 text-[11px]">
                      <Truck size={13} /> NCM Order #{sale.ncmOrderId}
                    </span>
                    <button
                      onClick={() => handleCheckLiveNcmStatus(sale.ncmOrderId)}
                      className="text-[10px] underline font-semibold text-red-500"
                    >
                      Track
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDispatchNcmSale(sale)}
                    className="w-full py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Truck size={14} /> Create Nepal Can Move Order
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border">
                  <div>
                    <span className="text-muted-foreground">Units: </span>
                    <span className="font-bold">{sale.quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Revenue: </span>
                    <span className="font-bold">{formatCurrency(sale.finalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Commission: </span>
                    <span className="font-bold text-emerald-600">{formatCurrency(sale.totalCommission)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span>{formatDate(sale.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSaleDetail(sale)}
                  className="w-full py-2 rounded-lg bg-accent text-foreground text-xs font-semibold"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
          <span>
            Showing {paginatedSales.length} of {filteredSales.length} sales
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-semibold text-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Sale Modal */}
      {addSaleOpen && <AddSaleModal isOpen={addSaleOpen} onClose={() => setAddSaleOpen(false)} onSuccess={fetchSales} />}

      {/* Manual NCM Dispatch Modal for Existing Sale */}
      {dispatchNcmSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-500 text-white shadow-md shadow-red-500/20">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Create NCM Courier Order</h3>
                  <p className="text-xs text-muted-foreground">Sale #{dispatchNcmSale.saleId}</p>
                </div>
              </div>
              <button onClick={() => setDispatchNcmSale(null)} className="p-1 rounded-lg hover:bg-accent">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualNcmDispatch} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-accent/50 border border-border space-y-1">
                <div><span className="text-muted-foreground">Customer: </span><span className="font-bold text-foreground">{dispatchNcmSale.customerName}</span></div>
                <div><span className="text-muted-foreground">Mobile: </span><span>{dispatchNcmSale.customerMobile}</span></div>
                <div><span className="text-muted-foreground">Address: </span><span>{dispatchNcmSale.customerAddress || "Kathmandu"}</span></div>
                <div><span className="text-muted-foreground">COD Amount: </span><span className="font-extrabold text-emerald-600">{formatCurrency(dispatchNcmSale.finalAmount)}</span></div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Destination Branch (Target) *</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground font-bold"
                >
                  {ncmBranches.map((b) => (
                    <option key={b} value={b}>
                      {b} Branch
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Delivery Type</label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground"
                >
                  <option value="Door2Door">Door2Door (Full Pickup & Door Delivery)</option>
                  <option value="Send">Branch2Door (Sender Drop at branch)</option>
                  <option value="D2B">Door2Branch (Customer Collect at branch)</option>
                  <option value="B2B">Branch2Branch</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchNcmSale(null)}
                  className="px-4 py-2 rounded-xl border border-border font-semibold hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatching}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Truck size={14} /> {dispatching ? "Creating..." : "Confirm & Send to NCM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live NCM Status Modal */}
      {liveStatusInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-500 text-white">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">NCM Live Tracking</h3>
                  <p className="text-xs text-muted-foreground">Order ID: #{liveStatusInfo.ncmOrderId}</p>
                </div>
              </div>
              <button onClick={() => setLiveStatusInfo(null)} className="p-1 rounded-lg hover:bg-accent">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
              {liveStatusInfo.details && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
                  <div className="font-bold text-red-600 dark:text-red-400">Nepal Can Move Portal Summary</div>
                  <div><span className="text-muted-foreground">COD Charge: </span><span className="font-bold">Rs. {liveStatusInfo.details.cod_charge || "-"}</span></div>
                  <div><span className="text-muted-foreground">Delivery Charge: </span><span>Rs. {liveStatusInfo.details.delivery_charge || "-"}</span></div>
                  <div><span className="text-muted-foreground">Delivery Status: </span><span className="font-extrabold text-foreground">{liveStatusInfo.details.last_delivery_status || "Processing"}</span></div>
                  <div><span className="text-muted-foreground">Payment Status: </span><span>{liveStatusInfo.details.payment_status || "Pending"}</span></div>
                </div>
              )}

              <h4 className="font-bold text-foreground">Status History Timeline</h4>
              {Array.isArray(liveStatusInfo.statusHistory) && liveStatusInfo.statusHistory.length > 0 ? (
                <div className="space-y-2 border-l-2 border-red-500/30 pl-3">
                  {liveStatusInfo.statusHistory.map((st: any, idx: number) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-red-500" /> {st.status || st.last_delivery_status}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {st.added_time ? new Date(st.added_time).toLocaleString() : "Recent"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No detailed tracking history records found yet.</p>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setLiveStatusInfo(null)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Detail Drawer Modal */}
      {activeSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">Sale Order #{activeSaleDetail.saleId}</h3>
              <button onClick={() => setActiveSaleDetail(null)} className="p-1 rounded-lg hover:bg-accent">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div><span className="text-muted-foreground">Customer: </span><span className="font-bold text-foreground">{activeSaleDetail.customerName}</span></div>
              <div><span className="text-muted-foreground">Mobile: </span><span>{activeSaleDetail.customerMobile}</span></div>
              <div><span className="text-muted-foreground">Product: </span><span>{activeSaleDetail.product}</span></div>
              <div><span className="text-muted-foreground">Quantity: </span><span className="font-bold">{activeSaleDetail.quantity}</span></div>
              <div><span className="text-muted-foreground">Selling Price: </span><span>{formatCurrency(activeSaleDetail.sellingPrice)}</span></div>
              <div><span className="text-muted-foreground">Total Revenue: </span><span className="font-extrabold text-primary">{formatCurrency(activeSaleDetail.finalAmount)}</span></div>
              <div><span className="text-muted-foreground">Salesperson Commission: </span><span className="font-extrabold text-emerald-600">{formatCurrency(activeSaleDetail.totalCommission)}</span></div>
              <div><span className="text-muted-foreground">Sales Executive: </span><span>{activeSaleDetail.salespersonName}</span></div>
              <div><span className="text-muted-foreground">Campaign: </span><span>{activeSaleDetail.campaign}</span></div>
            </div>

            {/* Nepal Can Move Info Box inside Sale Details */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <Truck size={15} /> Nepal Can Move Delivery
                </span>
                {activeSaleDetail.isNcmOrder && activeSaleDetail.ncmOrderId && (
                  <button
                    onClick={() => handleCheckLiveNcmStatus(activeSaleDetail.ncmOrderId)}
                    className="text-[10px] font-bold underline text-red-600 dark:text-red-400 flex items-center gap-1"
                  >
                    Track Live <ExternalLink size={10} />
                  </button>
                )}
              </div>

              {activeSaleDetail.isNcmOrder && activeSaleDetail.ncmOrderId ? (
                <div className="space-y-1 text-[11px]">
                  <div><span className="text-muted-foreground">NCM Order ID: </span><span className="font-extrabold text-foreground">#{activeSaleDetail.ncmOrderId}</span></div>
                  <div><span className="text-muted-foreground">Destination Branch: </span><span className="font-bold">{activeSaleDetail.ncmBranch || "KATHMANDU"}</span></div>
                  <div><span className="text-muted-foreground">Pickup Branch: </span><span>{activeSaleDetail.ncmPickupBranch || "TINKUNE"}</span></div>
                  <div><span className="text-muted-foreground">Status: </span><span className="font-semibold text-emerald-600">{activeSaleDetail.ncmStatus || "Pickup Order Created"}</span></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">No NCM order created yet for this sale.</p>
                  <button
                    onClick={() => {
                      setDispatchNcmSale(activeSaleDetail);
                    }}
                    className="w-full py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <Truck size={14} /> Create Nepal Can Move Order Now
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button onClick={() => setActiveSaleDetail(null)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
