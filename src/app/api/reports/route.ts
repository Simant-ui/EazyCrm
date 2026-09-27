import { NextRequest, NextResponse } from "next/server";
import { getSales, getLeads, getUsers, getPayments } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let allSales = await getSales();
    let allLeads = await getLeads();
    let allUsers = await getUsers();
    let allPayments = await getPayments();

    // Filter by Date Range if provided
    let filteredSales = allSales;
    let filteredLeads = allLeads;
    let filteredPayments = allPayments;

    if (startDateParam || endDateParam) {
      const start = startDateParam ? new Date(startDateParam) : new Date(0);
      const end = endDateParam ? new Date(endDateParam) : new Date();
      // Ensure end date covers full day till 23:59:59 if time is 00:00
      if (endDateParam && !endDateParam.includes("T")) {
        end.setHours(23, 59, 59, 999);
      }

      filteredSales = allSales.filter((s: any) => {
        const d = new Date(s.createdAt || s.updatedAt);
        return d >= start && d <= end;
      });

      filteredLeads = allLeads.filter((l: any) => {
        const d = new Date(l.createdAt);
        return d >= start && d <= end;
      });

      filteredPayments = allPayments.filter((p: any) => {
        const d = new Date(p.date || p.createdAt);
        return d >= start && d <= end;
      });
    }

    const validSales = filteredSales.filter((s: any) => s.status !== "CANCELLED");

    const totalUnits = validSales.reduce((acc: number, s: any) => acc + (s.quantity || 1), 0);
    const totalOrders = validSales.length;
    const totalRevenue = validSales.reduce((acc: number, s: any) => acc + (s.finalAmount || 0), 0);
    const totalCommission = validSales.reduce((acc: number, s: any) => acc + (s.totalCommission || 0), 0);
    const totalPaidCommission = filteredPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
    const totalRemainingCommission = Math.max(0, totalCommission - totalPaidCommission);
    const totalLeads = filteredLeads.length;
    const cancelledCount = filteredSales.filter((s: any) => s.status === "CANCELLED").length;

    // Member-wise breakdown for the selected period
    const memberBreakdown = allUsers.map((u: any) => {
      const uSales = validSales.filter((s: any) => s.salespersonId === u._id || s.salespersonName === u.name);
      const units = uSales.reduce((acc: number, s: any) => acc + (s.quantity || 1), 0);
      const rev = uSales.reduce((acc: number, s: any) => acc + (s.finalAmount || 0), 0);
      const comm = uSales.reduce((acc: number, s: any) => acc + (s.totalCommission || 0), 0);
      const uLeads = filteredLeads.filter((l: any) => l.salespersonId === u._id || l.salespersonName === u.name);
      const conv = uLeads.length > 0 ? ((uSales.length / uLeads.length) * 100).toFixed(1) : "0.0";

      return {
        memberId: u._id,
        name: u.name,
        role: u.role,
        salesCount: uSales.length,
        units,
        revenue: rev,
        commission: comm,
        leadsCount: uLeads.length,
        conversionRate: Number(conv),
      };
    });

    return NextResponse.json({
      summary: {
        totalUnits,
        totalOrders,
        totalRevenue,
        totalCommission,
        totalPaidCommission,
        totalRemainingCommission,
        totalLeads,
        cancelledCount,
      },
      memberBreakdown,
      sales: filteredSales,
      allSalesCount: allSales.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
