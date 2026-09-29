"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Plus, Eye, ShoppingBag, Phone, Mail, MapPin, Calendar, DollarSign, X, FileText } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { AddCustomerModal } from "./AddCustomerModal";

export function CustomersPageContent() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [addCustOpen, setAddCustOpen] = useState(false);
  const [activeCust, setActiveCust] = useState<any | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${search}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Customers Directory</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage customer profiles & full purchase history.</p>
        </div>

        <button
          onClick={() => setAddCustOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, mobile, email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
              <th className="py-3 px-3">Customer Name</th>
              <th className="py-3 px-3">Mobile & Email</th>
              <th className="py-3 px-3">Account Manager</th>
              <th className="py-3 px-3 text-center">Orders (Units)</th>
              <th className="py-3 px-3">Total Purchase</th>
              <th className="py-3 px-3">Last Purchase</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((cust) => (
              <tr key={cust._id} className="hover:bg-accent/40 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                      {getInitials(cust.name)}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{cust.name}</div>
                      <div className="text-[10px] text-muted-foreground">{cust.address || "Kathmandu"}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div className="font-semibold text-foreground">{cust.mobile}</div>
                  <div className="text-[10px] text-muted-foreground">{cust.email || "-"}</div>
                </td>
                <td className="py-3.5 px-3 font-medium text-foreground">{cust.salespersonName}</td>
                <td className="py-3.5 px-3 text-center">
                  <span className="font-bold text-foreground">{cust.totalOrders}</span>{" "}
                  <span className="text-muted-foreground">({cust.totalUnits || cust.totalOrders} Units)</span>
                </td>
                <td className="py-3.5 px-3 font-extrabold text-foreground">{formatCurrency(cust.totalSpent)}</td>
                <td className="py-3.5 px-3 text-muted-foreground">{formatDate(cust.lastPurchaseDate)}</td>
                <td className="py-3.5 px-3 text-right">
                  <button
                    onClick={() => setActiveCust(cust)}
                    className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-accent font-semibold text-[11px]"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addCustOpen && <AddCustomerModal isOpen={addCustOpen} onClose={() => setAddCustOpen(false)} onSuccess={fetchCustomers} />}

      {/* Customer Detail Drawer Modal */}
      {activeCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center">
                  {getInitials(activeCust.name)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{activeCust.name}</h3>
                  <p className="text-xs text-muted-foreground">{activeCust.mobile} · {activeCust.address}</p>
                </div>
              </div>
              <button onClick={() => setActiveCust(null)} className="p-1 rounded-lg hover:bg-accent">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-accent/40"><span className="text-muted-foreground">Total Orders: </span><span className="font-bold text-foreground">{activeCust.totalOrders}</span></div>
              <div className="p-3 rounded-xl bg-accent/40"><span className="text-muted-foreground">Total Spent: </span><span className="font-extrabold text-primary">{formatCurrency(activeCust.totalSpent)}</span></div>
              <div className="p-3 rounded-xl bg-accent/40"><span className="text-muted-foreground">Account Rep: </span><span className="font-bold text-foreground">{activeCust.salespersonName}</span></div>
              <div className="p-3 rounded-xl bg-accent/40"><span className="text-muted-foreground">Last Purchase: </span><span className="font-bold text-foreground">{formatDate(activeCust.lastPurchaseDate)}</span></div>
            </div>

            {/* Customer Remarks Timeline */}
            <div className="pt-3 border-t border-border space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-emerald-500" /> Customer Remarks & Notes History
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {activeCust.remarks && activeCust.remarks.length > 0 ? (
                  activeCust.remarks.map((r: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{r.addedBy || "Sales Executive"}</span>
                        <span>{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap font-medium">{r.text}</p>
                      {r.saleId && (
                        <div className="text-[10px] text-emerald-600 font-bold">Sale Ref: #{r.saleId}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-muted/20 text-center text-xs text-muted-foreground italic">
                    No remarks stored for this customer yet. Remarks added during sales creation will appear here automatically.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button onClick={() => setActiveCust(null)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
