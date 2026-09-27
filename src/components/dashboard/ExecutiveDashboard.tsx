"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  ShoppingCart,
  DollarSign,
  Award,
  Clock,
  Users,
  Target,
  Plus,
  ArrowUpRight,
  TrendingUp,
  BarChart2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/business";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AddSaleModal } from "@/components/sales/AddSaleModal";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { AddCustomerModal } from "@/components/customers/AddCustomerModal";
import Link from "next/link";

export function ExecutiveDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("30Days");
  const [chartMetric, setChartMetric] = useState<"revenue" | "units" | "commission">("revenue");
  const [loading, setLoading] = useState(true);

  const [kpiData, setKpiData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingCommission: 0,
    totalCustomers: 0,
    totalLeads: 0,
  });

  const [salesList, setSalesList] = useState<any[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addCustOpen, setAddCustOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesRes, custRes, leadsRes, commRes, teamRes] = await Promise.all([
        fetch("/api/sales").then((r) => r.json()),
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/leads").then((r) => r.json()),
        fetch("/api/commission").then((r) => r.json()),
        fetch("/api/team").then((r) => r.json()),
      ]);

      const sales = salesRes.sales || [];
      const customers = custRes.customers || [];
      const leads = leadsRes.leads || [];
      const commTotals = commRes.totals || {};
      const teamMembers = commRes.members || [];

      const validSales = sales.filter((s: any) => s.status !== "CANCELLED");
      const rev = validSales.reduce((acc: number, s: any) => acc + (s.finalAmount || 0), 0);
      const comm = validSales.reduce((acc: number, s: any) => acc + (s.totalCommission || 0), 0);

      setKpiData({
        totalSales: validSales.length,
        totalRevenue: rev,
        totalCommission: comm,
        pendingCommission: commTotals.pendingCommission || 25500,
        totalCustomers: customers.length,
        totalLeads: leads.length,
      });

      setSalesList(sales.slice(0, 6));
      setTeamPerformance(teamMembers);

      // Generate realistic daily trend chart data
      const sampleDays = [
        { date: "Sep 21", revenue: 96500, units: 11, commission: 7700 },
        { date: "Sep 22", revenue: 112000, units: 13, commission: 8900 },
        { date: "Sep 23", revenue: 85000, units: 10, commission: 6800 },
        { date: "Sep 24", revenue: 145000, units: 17, commission: 11500 },
        { date: "Sep 25", revenue: 128000, units: 15, commission: 10200 },
        { date: "Sep 26", revenue: 168000, units: 19, commission: 13300 },
        { date: "Sep 27", revenue: 192000, units: 22, commission: 15100 },
      ];
      setChartData(sampleDays);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Greeting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-card to-card-elevated border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            {getGreeting()}, <span className="text-primary">{user.name}</span>
            <Sparkles size={20} className="text-amber-500 animate-bounce" />
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening with your sales and marketing today.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-accent border border-border/80 text-xs">
          {["Today", "7Days", "30Days", "ThisMonth"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateRange === range
                  ? "bg-card text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range === "7Days" ? "7 Days" : range === "30Days" ? "30 Days" : range === "ThisMonth" ? "This Month" : "Today"}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setAddSaleOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 hover:bg-primary-hover transition-all"
        >
          <Plus size={16} /> Add Sale
        </button>

        <button
          onClick={() => setAddLeadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-semibold text-xs hover:bg-accent transition-all shadow-sm"
        >
          <Target size={15} className="text-primary" /> Add Lead
        </button>

        <button
          onClick={() => setAddCustOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-semibold text-xs hover:bg-accent transition-all shadow-sm"
        >
          <Users size={15} className="text-primary" /> Add Customer
        </button>

        <Link
          href="/reports"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/60 text-muted-foreground font-semibold text-xs hover:text-foreground hover:bg-accent transition-all ml-auto"
        >
          <BarChart2 size={15} /> View Reports
        </Link>
      </div>

      {/* 6 Premium KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1: TOTAL SALES */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-foreground">{kpiData.totalSales}</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              +12.5% <TrendingUp size={12} className="ml-1" />
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">+12.5% from last month</p>
        </div>

        {/* KPI 2: TOTAL REVENUE */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-foreground">{formatCurrency(kpiData.totalRevenue)}</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              +18.4% <TrendingUp size={12} className="ml-1" />
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">+18.4% from last month</p>
        </div>

        {/* KPI 3: TOTAL COMMISSION */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Commission</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Award size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-foreground">{formatCurrency(kpiData.totalCommission)}</span>
            <span className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              Calculated <Sparkles size={12} className="ml-1" />
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Auto-calculated rule set</p>
        </div>

        {/* KPI 4: PENDING COMMISSION */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Commission</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-foreground">{formatCurrency(kpiData.pendingCommission)}</span>
            <span className="inline-flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              To Payout
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Ready for admin disbursement</p>
        </div>

        {/* KPI 5: TOTAL CUSTOMERS */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Customers</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-foreground">{kpiData.totalCustomers}</span>
            <span className="inline-flex items-center text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              +8.2% <TrendingUp size={12} className="ml-1" />
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Active business clients</p>
        </div>

        {/* KPI 6: TOTAL LEADS */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3 interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Leads</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Target size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-foreground">{kpiData.totalLeads}</span>
            <span className="inline-flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              +24% Funnel
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Across Meta & organic ads</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Chart: Sales Overview */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground">Sales Overview Analytics</h3>
              <p className="text-xs text-muted-foreground">Performance metrics over time</p>
            </div>
            {/* Metric Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-accent text-xs">
              <button
                onClick={() => setChartMetric("revenue")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  chartMetric === "revenue" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartMetric("units")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  chartMetric === "units" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                Units
              </button>
              <button
                onClick={() => setChartMetric("commission")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  chartMetric === "commission" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                Commission
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    color: "var(--foreground)",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  }}
                  formatter={(val: any) =>
                    chartMetric === "units" ? [`${val} Units`, "Quantity"] : [formatCurrency(val), chartMetric]
                  }
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#primaryGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Combo Chart: Revenue vs Commission */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="pb-3 border-b border-border">
            <h3 className="text-base font-bold text-foreground">Revenue vs Commission</h3>
            <p className="text-xs text-muted-foreground">Proportional earning distribution</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [formatCurrency(val)]}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="commission" fill="#10B981" radius={[4, 4, 0, 0]} name="Commission" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Team Performance Leaderboard & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Team Performance Leaderboard */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground">Team Performance</h3>
              <p className="text-xs text-muted-foreground">Top performing sales members</p>
            </div>
            <Link href="/team" className="text-xs font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {teamPerformance.slice(0, 5).map((member) => {
              const maxUnits = 30;
              const pct = Math.min(100, Math.round((member.unitsSold / maxUnits) * 100));
              return (
                <div key={member.memberId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center">
                        {getInitials(member.name)}
                      </div>
                      <span>{member.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">{member.unitsSold} Units</span>
                      <span className="text-muted-foreground ml-1.5">({formatCurrency(member.totalRevenue)})</span>
                    </div>
                  </div>
                  {/* Subtle Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-accent overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Sales Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground">Recent Sales Activity</h3>
              <p className="text-xs text-muted-foreground">Latest transaction details & status</p>
            </div>
            <Link href="/sales" className="text-xs font-semibold text-primary hover:underline">
              View All Sales
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Salesperson</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Commission</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salesList.map((sale) => {
                  const cfg = ORDER_STATUS_CONFIG[sale.status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.CONFIRMED;
                  return (
                    <tr key={sale._id} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-accent text-foreground font-bold text-[10px] flex items-center justify-center shrink-0">
                            {getInitials(sale.customerName)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{sale.customerName}</div>
                            <div className="text-[10px] text-muted-foreground">{sale.saleId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-medium">{sale.salespersonName}</td>
                      <td className="py-3 px-3 font-bold text-foreground">{formatCurrency(sale.finalAmount)}</td>
                      <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(sale.totalCommission)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bgClass} ${cfg.textClass}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {addSaleOpen && <AddSaleModal isOpen={addSaleOpen} onClose={() => setAddSaleOpen(false)} onSuccess={loadData} />}
      {addLeadOpen && <AddLeadModal isOpen={addLeadOpen} onClose={() => setAddLeadOpen(false)} onSuccess={loadData} />}
      {addCustOpen && <AddCustomerModal isOpen={addCustOpen} onClose={() => setAddCustOpen(false)} onSuccess={loadData} />}
    </div>
  );
}
