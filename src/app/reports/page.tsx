"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  Award,
  Target,
  Calendar,
  FileSpreadsheet,
  FileText,
  Share2,
  RefreshCw,
  CheckCircle2,
  Users,
  ShoppingCart,
  Filter,
  ArrowUpRight,
  Database,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type DatePreset = "today" | "yesterday" | "this_month" | "last_month" | "all_time" | "custom";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Date Filter States
  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [periodLabel, setPeriodLabel] = useState<string>("This Month");

  // Helper to format date string YYYY-MM-DD
  const formatDateInput = (d: Date) => {
    return d.toISOString().split("T")[0];
  };

  // Set default dates on preset change
  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const now = new Date();

    if (newPreset === "today") {
      const todayStr = formatDateInput(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setPeriodLabel(`Today (${todayStr})`);
    } else if (newPreset === "yesterday") {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      const yestStr = formatDateInput(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
      setPeriodLabel(`Yesterday (${yestStr})`);
    } else if (newPreset === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateInput(startOfMonth));
      setEndDate(formatDateInput(now));
      setPeriodLabel(`This Month (${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()})`);
    } else if (newPreset === "last_month") {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatDateInput(startOfLastMonth));
      setEndDate(formatDateInput(endOfLastMonth));
      setPeriodLabel(`Last Month (${startOfLastMonth.toLocaleString("default", { month: "short" })} ${startOfLastMonth.getFullYear()})`);
    } else if (newPreset === "all_time") {
      setStartDate("");
      setEndDate("");
      setPeriodLabel("All Time Report");
    } else {
      setPeriodLabel("Custom Range");
    }
  };

  // Load Report Data
  const loadReports = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const res = await fetch(`/api/reports?${queryParams.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error("Failed to load executive reports");
    } finally {
      setLoading(false);
    }
  };

  // Check DB Connection
  const checkDb = async () => {
    try {
      const res = await fetch("/api/db/init");
      const json = await res.json();
      setDbStatus(json);
    } catch (e) {}
  };

  useEffect(() => {
    handlePresetChange("this_month");
    checkDb();
  }, []);

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  // Export PDF Function using jsPDF & autoTable
  const handleExportPDF = () => {
    if (!data) return;

    try {
      const doc = new jsPDF();
      const summary = data.summary || {};
      const memberBreakdown = data.memberBreakdown || [];
      const sales = data.sales || [];

      // --- Header Brand Styling ---
      doc.setFillColor(16, 185, 129); // Emerald Primary Green
      doc.rect(0, 0, 210, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("EazyInvo - Executive Sales & Financial Report", 14, 16);

      // Meta Header Subtext
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Report Period: ${periodLabel}`, 14, 32);
      doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 37);
      doc.text(`Total Records Filtered: ${sales.length} Sales`, 14, 42);

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 46, 196, 46);

      // --- Section 1: Executive Key Metrics Grid ---
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text("1. Financial & Operational Key Metrics", 14, 54);

      const metricsTableData = [
        [
          "Total Revenue",
          `Rs. ${(summary.totalRevenue || 0).toLocaleString()}`,
          "Total Orders / Sales",
          `${summary.totalOrders || 0} Orders`,
        ],
        [
          "Units Sold",
          `${summary.totalUnits || 0} Units`,
          "Total Leads",
          `${summary.totalLeads || 0} Leads`,
        ],
        [
          "Total Commission",
          `Rs. ${(summary.totalCommission || 0).toLocaleString()}`,
          "Paid Commission",
          `Rs. ${(summary.totalPaidCommission || 0).toLocaleString()}`,
        ],
        [
          "Remaining Commission",
          `Rs. ${(summary.totalRemainingCommission || 0).toLocaleString()}`,
          "Cancelled Orders",
          `${summary.cancelledCount || 0}`,
        ],
      ];

      autoTable(doc, {
        startY: 58,
        head: [["Metric", "Value", "Metric", "Value"]],
        body: metricsTableData,
        theme: "grid",
        headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      // --- Section 2: Team Member Performance Table ---
      const memberY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text("2. Salesperson Team Performance", 14, memberY);

      const memberRows = memberBreakdown.map((m: any) => [
        m.name,
        m.role,
        m.salesCount,
        m.units,
        `Rs. ${m.revenue.toLocaleString()}`,
        `Rs. ${m.commission.toLocaleString()}`,
        `${m.conversionRate}%`,
      ]);

      autoTable(doc, {
        startY: memberY + 4,
        head: [["Name", "Role", "Sales", "Units", "Revenue", "Commission", "Conv. Rate"]],
        body: memberRows,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
      });

      // --- Section 3: Sales Transactions Log ---
      const salesY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text("3. Sales Transactions Log", 14, salesY);

      const salesRows = sales.slice(0, 30).map((s: any) => [
        s.saleId,
        s.customerName,
        s.product,
        s.quantity,
        `Rs. ${(s.finalAmount || 0).toLocaleString()}`,
        s.salespersonName,
        s.status,
        s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "",
      ]);

      autoTable(doc, {
        startY: salesY + 4,
        head: [["ID", "Customer", "Product", "Qty", "Amount", "Salesperson", "Status", "Date"]],
        body: salesRows,
        theme: "plain",
        headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2 },
      });

      // --- Footer ---
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `EazyInvo CRM System • Confidential Report • Page ${i} of ${pageCount}`,
          14,
          288
        );
      }

      doc.save(`EazyInvo_Report_${preset}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF Report generated & downloaded successfully!");
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to export PDF: " + err.message);
    }
  };

  // Export Excel Function using XLSX
  const handleExportExcel = () => {
    if (!data) return;

    try {
      const summary = data.summary || {};
      const memberBreakdown = data.memberBreakdown || [];
      const sales = data.sales || [];

      // Sheet 1: Summary Metrics
      const summarySheetData = [
        ["EazyInvo Executive Summary Report"],
        ["Report Period", periodLabel],
        ["Generated Date", new Date().toLocaleString()],
        [],
        ["Metric", "Value"],
        ["Total Revenue (NPR)", summary.totalRevenue],
        ["Total Orders", summary.totalOrders],
        ["Total Units Sold", summary.totalUnits],
        ["Total Leads", summary.totalLeads],
        ["Total Commission Earned", summary.totalCommission],
        ["Paid Commission", summary.totalPaidCommission],
        ["Remaining Unpaid Commission", summary.totalRemainingCommission],
        ["Cancelled Orders", summary.cancelledCount],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summarySheetData);

      // Sheet 2: Team Performance
      const memberSheetData = memberBreakdown.map((m: any) => ({
        "Member Name": m.name,
        Role: m.role,
        "Total Orders": m.salesCount,
        "Units Sold": m.units,
        "Revenue (NPR)": m.revenue,
        "Commission (NPR)": m.commission,
        "Total Leads": m.leadsCount,
        "Conversion Rate (%)": m.conversionRate,
      }));
      const memberWs = XLSX.utils.json_to_sheet(memberSheetData);

      // Sheet 3: Sales Details
      const salesSheetData = sales.map((s: any) => ({
        "Sale ID": s.saleId,
        "Customer Name": s.customerName,
        "Mobile Number": s.customerMobile,
        "Product": s.product,
        "Quantity": s.quantity,
        "Selling Price": s.sellingPrice,
        "Subtotal": s.subtotal,
        "Commission": s.totalCommission,
        "Final Amount": s.finalAmount,
        "Payment Method": s.paymentMethod,
        "Salesperson": s.salespersonName,
        "Status": s.status,
        "Date": s.createdAt ? new Date(s.createdAt).toLocaleString() : "",
      }));
      const salesWs = XLSX.utils.json_to_sheet(salesSheetData);

      // Create Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
      XLSX.utils.book_append_sheet(wb, memberWs, "Team Performance");
      XLSX.utils.book_append_sheet(wb, salesWs, "Sales Details");

      XLSX.writeFile(wb, `EazyInvo_Report_${preset}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel Financial Report downloaded!");
    } catch (err: any) {
      console.error("Excel Export Error:", err);
      toast.error("Failed to export Excel report");
    }
  };

  // Share Summary Report
  const handleShareReport = async () => {
    if (!data) return;
    const summary = data.summary || {};
    const text = `📊 *EazyInvo Executive Summary Report* (${periodLabel})
---------------------------------------
💰 Total Revenue: Rs. ${(summary.totalRevenue || 0).toLocaleString()}
📦 Orders Confirmed: ${summary.totalOrders || 0} (${summary.totalUnits || 0} Units)
🎯 Total Leads: ${summary.totalLeads || 0}
💵 Commission Earned: Rs. ${(summary.totalCommission || 0).toLocaleString()}
---------------------------------------
Generated via EazyInvo CRM`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "EazyInvo Sales Report",
          text: text,
        });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Summary report copied to clipboard! Ready to share on WhatsApp or Email.");
    }
  };

  const summary = data?.summary || {};
  const memberBreakdown = data?.memberBreakdown || [];

  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

  const statusCounts = (data?.sales || []).reduce((acc: any, s: any) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.keys(statusCounts).map((k) => ({
    name: k,
    value: statusCounts[k],
  }));

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Top Header & DB Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                Executive Reports & Financial Statements
                <BarChart3 size={22} className="text-emerald-500" />
              </h2>
              {dbStatus?.status === "CONNECTED" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                  <Database size={12} /> MongoDB Active
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Filter sales velocity, commission payouts, and team performance metrics for any date period. Export to PDF or Excel.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
            >
              <FileText size={15} /> Export PDF Report
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950 dark:bg-emerald-900 text-emerald-100 font-semibold text-xs border border-emerald-700 hover:bg-emerald-900 transition-colors"
            >
              <FileSpreadsheet size={15} /> Export Excel (.xlsx)
            </button>
            <button
              onClick={handleShareReport}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs transition-colors"
              title="Share or Copy Summary"
            >
              <Share2 size={15} /> Share Report
            </button>
          </div>
        </div>

        {/* --- Date Selection Toolbar --- */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Calendar size={16} className="text-emerald-500" />
              <span>Select Date Filter Period:</span>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active Range: {periodLabel}
            </span>
          </div>

          {/* Preset Buttons Grid */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handlePresetChange("today")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                preset === "today"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "bg-accent/60 hover:bg-accent text-muted-foreground"
              }`}
            >
              Today
            </button>

            <button
              onClick={() => handlePresetChange("yesterday")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                preset === "yesterday"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "bg-accent/60 hover:bg-accent text-muted-foreground"
              }`}
            >
              Yesterday
            </button>

            <button
              onClick={() => handlePresetChange("this_month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                preset === "this_month"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "bg-accent/60 hover:bg-accent text-muted-foreground"
              }`}
            >
              This Month
            </button>

            <button
              onClick={() => handlePresetChange("last_month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                preset === "last_month"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "bg-accent/60 hover:bg-accent text-muted-foreground"
              }`}
            >
              Last Month
            </button>

            <button
              onClick={() => handlePresetChange("all_time")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                preset === "all_time"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "bg-accent/60 hover:bg-accent text-muted-foreground"
              }`}
            >
              All Time
            </button>

            <button
              onClick={() => setPreset("custom")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                preset === "custom"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "bg-accent/60 hover:bg-accent text-muted-foreground"
              }`}
            >
              Custom Date Range
            </button>
          </div>

          {/* Custom Date Inputs */}
          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">From Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPeriodLabel(`Custom (${e.target.value} to ${endDate || "Today"})`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">To Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPeriodLabel(`Custom (${startDate || "Beginning"} to ${e.target.value})`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={loadReports}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs shadow-sm hover:bg-emerald-700 transition-colors"
              >
                Apply Range Filter
              </button>
            </div>
          )}
        </div>

        {/* --- Metric Cards Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total Revenue</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {formatCurrency(summary.totalRevenue || 0)}
              </h3>
              <p className="text-[11px] text-emerald-500 font-medium mt-0.5 flex items-center gap-1">
                <ArrowUpRight size={12} /> {summary.totalOrders || 0} Confirmed Orders
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Units Sold</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {summary.totalUnits || 0} <span className="text-sm font-normal text-muted-foreground">Units</span>
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                From {data?.sales?.length || 0} Total Transactions
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-500">
              <ShoppingCart size={24} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total Commission</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {formatCurrency(summary.totalCommission || 0)}
              </h3>
              <p className="text-[11px] text-amber-500 font-medium mt-0.5">
                Remaining: {formatCurrency(summary.totalRemainingCommission || 0)}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Award size={24} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Leads Analyzed</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {summary.totalLeads || 0} <span className="text-sm font-normal text-muted-foreground">Leads</span>
              </h3>
              <p className="text-[11px] text-purple-500 font-medium mt-0.5">
                Conversion Pipeline
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-500">
              <Target size={24} />
            </div>
          </div>
        </div>

        {/* --- Interactive Charts --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Distribution */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              Order Status Distribution ({periodLabel})
            </h3>
            <div className="h-64 w-full">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  No order data found for selected period.
                </div>
              )}
            </div>
          </div>

          {/* Member Sales Performance Bar Chart */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              Team Member Revenue ({periodLabel})
            </h3>
            <div className="h-64 w-full">
              {memberBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memberBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(val: any) => formatCurrency(val)} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  No member breakdown data found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Salesperson Performance Breakdown Table --- */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Users size={18} className="text-emerald-500" />
              Sales Team Performance Breakdown ({periodLabel})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-accent/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Units Sold</th>
                  <th className="px-4 py-3">Revenue Generated</th>
                  <th className="px-4 py-3">Commission Earned</th>
                  <th className="px-4 py-3">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {memberBreakdown.map((m: any) => (
                  <tr key={m.memberId} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{m.role.replace("_", " ")}</td>
                    <td className="px-4 py-3 font-medium">{m.salesCount}</td>
                    <td className="px-4 py-3 font-medium">{m.units}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(m.revenue)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(m.commission)}</td>
                    <td className="px-4 py-3 font-medium text-purple-500">{m.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
