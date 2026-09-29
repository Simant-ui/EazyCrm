import { NextRequest, NextResponse } from "next/server";
import { getSales, getUsers, getPayments, isMongoConnected, memoryStore } from "@/lib/db";
import { CommissionPayment, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { getCommissions } from "@/lib/commission-engine";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const sales = await getSales();
    let users = await getUsers();
    let payments = await getPayments();
    let commissions = await getCommissions();

    // Role-based data scoping: Non-admin staff only see their own commission data!
    if (currentUser.role !== "ADMIN") {
      users = users.filter((u: any) => String(u._id) === String(currentUser.id) || u.name === currentUser.name);
      payments = payments.filter((p: any) => String(p.salespersonId) === String(currentUser.id) || p.salespersonName === currentUser.name);
      commissions = commissions.filter((c: any) => String(c.memberId) === String(currentUser.id) || c.memberName === currentUser.name);
    }

    // Calculate commission summaries per salesperson using DELIVERED status rule!
    const memberSummaries = users.map((user: any) => {
      // Rule: ONLY DELIVERED sales generate earned commission
      const deliveredSales = sales.filter(
        (s: any) =>
          (s.salespersonId === user._id || s.salespersonName === user.name) &&
          (s.status === "DELIVERED" || s.status === "COMPLETED")
      );

      const allUserSales = sales.filter(
        (s: any) => s.salespersonId === user._id || s.salespersonName === user.name
      );

      const unitsSold = deliveredSales.reduce((acc: number, s: any) => acc + (s.quantity || 1), 0);
      const totalRevenue = deliveredSales.reduce((acc: number, s: any) => acc + (s.finalAmount || 0), 0);

      // Fetch commission amount from CommissionRecords or delivered sales totalCommission
      const userCommRecords = commissions.filter(
        (c: any) => (c.memberId === user._id || c.memberName === user.name) && c.status !== "REVERSED"
      );

      const totalCommission =
        userCommRecords.length > 0
          ? userCommRecords.reduce((acc: number, c: any) => acc + (c.commissionAmount || 0), 0)
          : deliveredSales.reduce((acc: number, s: any) => acc + (s.totalCommission || 0), 0);

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
        commissionRate: user.commissionRate || 5,
        unitsSold,
        salesCount: allUserSales.length,
        deliveredCount: deliveredSales.length,
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

    return NextResponse.json({
      totals: {
        totalCommission: grandTotalCommission,
        paidCommission: grandPaidCommission,
        pendingCommission: grandPendingCommission,
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
