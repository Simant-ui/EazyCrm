"use client";

import React, { useState, useEffect } from "react";
import { Award, CheckCircle2, Clock, DollarSign, Plus, UserCheck, Calendar, ArrowUpRight, Sparkles, CreditCard, X } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";

export function CommissionDashboard() {
  const [data, setData] = useState<{
    totals: { totalCommission: number; paidCommission: number; pendingCommission: number; thisMonthCommission: number };
    members: any[];
    payments: any[];
  }>({
    totals: { totalCommission: 0, paidCommission: 0, pendingCommission: 0, thisMonthCommission: 0 },
    members: [],
    payments: [],
  });

  const [loading, setLoading] = useState(true);
  const [selectedTabMember, setSelectedTabMember] = useState<string>("ALL");
  const [markPaidTarget, setMarkPaidTarget] = useState<any | null>(null);
  const [memberDetailTarget, setMemberDetailTarget] = useState<any | null>(null);

  // Form state for mark as paid
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("Bank Transfer (NABIL)");
  const [payReference, setPayReference] = useState("");
  const [payRemark, setPayRemark] = useState("");
  const [paying, setPaying] = useState(false);

  const fetchCommission = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/commission");
      const d = await res.json();
      setData(d);
    } catch (e) {
      toast.error("Failed to load commission data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommission();
  }, []);

  const openMarkPaid = (member: any) => {
    setMarkPaidTarget(member);
    setPayAmount(member.remaining);
    setPayReference("");
    setPayRemark("");
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markPaidTarget || payAmount <= 0) return;

    setPaying(true);
    try {
      const res = await fetch("/api/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salespersonId: markPaidTarget.memberId,
          salespersonName: markPaidTarget.name,
          amount: payAmount,
          paymentMethod: payMethod,
          reference: payReference,
          remark: payRemark,
        }),
      });

      if (res.ok) {
        toast.success(`Commission payment of ${formatCurrency(payAmount)} recorded for ${markPaidTarget.name}!`);
        setMarkPaidTarget(null);
        fetchCommission();
      } else {
        toast.error("Payment recording failed");
      }
    } catch (e) {
      toast.error("Error processing payment");
    } finally {
      setPaying(false);
    }
  };

  const filteredMembers =
    selectedTabMember === "ALL"
      ? data.members
      : data.members.filter((m) => m.name === selectedTabMember || m.memberId === selectedTabMember);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Commission Management</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track executive commissions, payouts, and historical disbursement logs.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Commission */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Commission</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Award size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground">{formatCurrency(data.totals.totalCommission)}</div>
          <p className="text-[11px] text-muted-foreground">Earned across all sales</p>
        </div>

        {/* Paid Commission */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid Commission</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(data.totals.paidCommission)}
          </div>
          <p className="text-[11px] text-muted-foreground">Disbursed to team members</p>
        </div>

        {/* Pending Commission */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Commission</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {formatCurrency(data.totals.pendingCommission)}
          </div>
          <p className="text-[11px] text-muted-foreground">Awaiting admin payout</p>
        </div>

        {/* This Month Commission */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">This Month</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground">{formatCurrency(data.totals.thisMonthCommission)}</div>
          <p className="text-[11px] text-muted-foreground">Current month calculations</p>
        </div>
      </div>

      {/* Dynamic Member-Wise Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card border border-border overflow-x-auto text-xs">
        <button
          onClick={() => setSelectedTabMember("ALL")}
          className={`px-4 py-2 rounded-xl font-semibold transition-all shrink-0 ${
            selectedTabMember === "ALL" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          All Members ({data.members.length})
        </button>
        {data.members.map((m) => (
          <button
            key={m.memberId}
            onClick={() => setSelectedTabMember(m.name)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all shrink-0 ${
              selectedTabMember === m.name ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Member Commission Breakdown Table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">Member Payout Summary</h3>
            <p className="text-xs text-muted-foreground">Total earned vs paid out per team member</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Salesperson</th>
                <th className="py-3 px-3 text-center">Units Sold</th>
                <th className="py-3 px-3">Total Commission</th>
                <th className="py-3 px-3">Paid Amount</th>
                <th className="py-3 px-3">Remaining Payout</th>
                <th className="py-3 px-3">Payout Progress</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((m) => {
                const paidPct = m.totalCommission > 0 ? Math.min(100, Math.round((m.paid / m.totalCommission) * 100)) : 0;
                return (
                  <tr key={m.memberId} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                          {getInitials(m.name)}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground">{m.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-foreground">{m.unitsSold}</td>
                    <td className="py-3.5 px-3 font-extrabold text-foreground">{formatCurrency(m.totalCommission)}</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(m.paid)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(m.remaining)}
                    </td>
                    <td className="py-3.5 px-3 w-36">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                          <span>{paidPct}%</span>
                          <span>{m.remaining === 0 ? "Fully Paid" : "Pending"}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-accent overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              paidPct === 100 ? "bg-emerald-500" : "bg-primary"
                            }`}
                            style={{ width: `${paidPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setMemberDetailTarget(m)}
                          className="px-2.5 py-1.5 rounded-lg border border-border text-foreground hover:bg-accent font-semibold text-[11px]"
                        >
                          Details
                        </button>
                        {m.remaining > 0 && (
                          <button
                            onClick={() => openMarkPaid(m)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] shadow-sm hover:bg-emerald-700 transition-colors"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permanent Payout History Logs Table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="pb-3 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Permanent Payout History</h3>
          <p className="text-xs text-muted-foreground">Historical records of all commission payments</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Salesperson</th>
                <th className="py-2.5 px-3">Amount Paid</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Reference / Txn ID</th>
                <th className="py-2.5 px-3">Remark</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.payments.map((p) => (
                <tr key={p._id} className="hover:bg-accent/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-foreground">{p.salespersonName}</td>
                  <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</td>
                  <td className="py-3 px-3 text-muted-foreground">{p.paymentMethod}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">{p.reference || "-"}</td>
                  <td className="py-3 px-3 text-muted-foreground">{p.remark || "-"}</td>
                  <td className="py-3 px-3 text-muted-foreground">{formatDate(p.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark as Paid Modal */}
      {markPaidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-elevated">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                <h2 className="text-base font-bold text-foreground">Record Commission Payment</h2>
              </div>
              <button onClick={() => setMarkPaidTarget(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                Paying: {markPaidTarget.name} (Remaining Pending: {formatCurrency(markPaidTarget.remaining)})
              </div>

              <div>
                <label className="block font-medium mb-1">Payment Amount (Rs.) *</label>
                <input
                  type="number"
                  max={markPaidTarget.remaining}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Bank Transfer (NABIL)">Bank Transfer (NABIL Bank)</option>
                  <option value="eSewa Direct">eSewa Wallet</option>
                  <option value="Fonepay QR">Fonepay QR</option>
                  <option value="Cash Payout">Cash Payout</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Transaction Reference / Txn ID</label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="e.g. TXN-998811"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Remark / Payout Notes</label>
                <input
                  type="text"
                  value={payRemark}
                  onChange={(e) => setPayRemark(e.target.value)}
                  placeholder="e.g. Full settlement for Q3 sales"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMarkPaidTarget(null)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-md"
                >
                  {paying ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail Drawer Modal */}
      {memberDetailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-lg text-foreground">{memberDetailTarget.name}</h3>
                <p className="text-xs text-muted-foreground">{memberDetailTarget.department} · {memberDetailTarget.email}</p>
              </div>
              <button onClick={() => setMemberDetailTarget(null)} className="p-1 rounded-lg hover:bg-accent">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-accent/50"><span className="text-muted-foreground">Units Sold: </span><span className="font-bold text-foreground text-sm">{memberDetailTarget.unitsSold}</span></div>
              <div className="p-3 rounded-xl bg-accent/50"><span className="text-muted-foreground">Total Revenue: </span><span className="font-bold text-foreground text-sm">{formatCurrency(memberDetailTarget.totalRevenue)}</span></div>
              <div className="p-3 rounded-xl bg-accent/50"><span className="text-muted-foreground">Total Commission: </span><span className="font-bold text-foreground text-sm">{formatCurrency(memberDetailTarget.totalCommission)}</span></div>
              <div className="p-3 rounded-xl bg-accent/50"><span className="text-muted-foreground">Paid Amount: </span><span className="font-bold text-emerald-600 text-sm">{formatCurrency(memberDetailTarget.paid)}</span></div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button onClick={() => setMemberDetailTarget(null)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
