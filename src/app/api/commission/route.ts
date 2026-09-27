import { NextRequest, NextResponse } from "next/server";
import { getSales, getUsers, getPayments, isMongoConnected, memoryStore } from "@/lib/db";
import { CommissionPayment, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sales = await getSales();
    const users = await getUsers();
    const payments = await getPayments();

    const activeSalespeople = users.filter((u: any) => u.role !== "ADMIN" || true);

    // Calculate commission summaries per salesperson
    const memberSummaries = activeSalespeople.map((user: any) => {
      const userSales = sales.filter(
        (s: any) =>
          (s.salespersonId === user._id || s.salespersonName === user.name) &&
          s.status !== "CANCELLED"
      );

      const unitsSold = userSales.reduce((acc: number, s: any) => acc + (s.quantity || 1), 0);
      const totalRevenue = userSales.reduce((acc: number, s: any) => acc + (s.finalAmount || 0), 0);
      const totalCommission = userSales.reduce(
        (acc: number, s: any) => acc + (s.totalCommission || 0),
        0
      );

      const userPayments = payments.filter(
        (p: any) => p.salespersonId === user._id || p.salespersonName === user.name
      );
      const paidAmount = userPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
      const remainingAmount = Math.max(0, totalCommission - paidAmount);

      return {
        memberId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        unitsSold,
        salesCount: userSales.length,
        totalRevenue,
        totalCommission,
        paid: paidAmount,
        remaining: remainingAmount,
        status: remainingAmount > 0 ? "PENDING" : totalCommission > 0 ? "PAID" : "NO_COMMISSION",
        paymentHistory: userPayments,
      };
    });

    const grandTotalCommission = memberSummaries.reduce((acc, m) => acc + m.totalCommission, 0);
    const grandPaidCommission = memberSummaries.reduce((acc, m) => acc + m.paid, 0);
    const grandPendingCommission = Math.max(0, grandTotalCommission - grandPaidCommission);

    // This month commission
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const thisMonthCommission = sales
      .filter((s: any) => s.status !== "CANCELLED" && String(s.createdAt).substring(0, 7) === currentMonthStr)
      .reduce((acc: number, s: any) => acc + (s.totalCommission || 0), 0);

    return NextResponse.json({
      totals: {
        totalCommission: grandTotalCommission,
        paidCommission: grandPaidCommission,
        pendingCommission: grandPendingCommission,
        thisMonthCommission,
      },
      members: memberSummaries,
      payments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();

    const { salespersonId, salespersonName, amount, paymentMethod = "Bank Transfer", date, reference = "", remark = "" } = body;

    if (!salespersonId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Salesperson and a valid amount are required" }, { status: 400 });
    }

    const paymentData = {
      salespersonId,
      salespersonName: salespersonName || "Sales Executive",
      amount: Number(amount),
      paymentMethod,
      date: date ? new Date(date) : new Date(),
      reference,
      remark,
      createdAt: new Date(),
    };

    if (isMongoConnected()) {
      const payment = await CommissionPayment.create(paymentData);
      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "MARK_COMMISSION_PAID",
        module: "commission",
        recordId: String(payment._id),
        details: `${currentUser.name} marked Rs. ${amount.toLocaleString()} commission as paid to ${salespersonName} via ${paymentMethod}`,
      });
      return NextResponse.json({ success: true, payment });
    } else {
      const payWithId = { _id: `pay_${Date.now()}`, ...paymentData };
      memoryStore.payments.unshift(payWithId);
      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "MARK_COMMISSION_PAID",
        module: "commission",
        recordId: payWithId._id,
        details: `${currentUser.name} marked Rs. ${amount.toLocaleString()} commission as paid to ${salespersonName} via ${paymentMethod}`,
        createdAt: new Date(),
      });
      return NextResponse.json({ success: true, payment: payWithId });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
