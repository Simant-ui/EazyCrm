import { NextRequest, NextResponse } from "next/server";
import { getPayments, getUsers, isMongoConnected, memoryStore } from "@/lib/db";
import { CommissionPayment, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salespersonId = searchParams.get("salespersonId");

    let payments = await getPayments();
    if (salespersonId && salespersonId !== "ALL") {
      payments = payments.filter((p: any) => p.salespersonId === salespersonId);
    }

    return NextResponse.json({ payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const { salespersonId, amount, paymentMethod = "Bank Transfer", reference = "", remark = "" } = await req.json();

    if (!salespersonId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "salespersonId and valid positive amount are required" }, { status: 400 });
    }

    const users = await getUsers();
    const member = users.find((u: any) => u._id === salespersonId || u.name === salespersonId);

    const paymentData = {
      salespersonId: member ? member._id : salespersonId,
      salespersonName: member ? member.name : salespersonId,
      amount: Number(amount),
      paymentMethod,
      date: new Date(),
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
        action: "RECORD_COMMISSION_PAYMENT",
        module: "commission",
        recordId: String(payment._id),
        details: `${currentUser.name} recorded Rs. ${amount} commission payment to ${paymentData.salespersonName} via ${paymentMethod}`,
      });

      return NextResponse.json({ success: true, payment });
    } else {
      const payment = {
        _id: `pay_${Date.now()}`,
        ...paymentData,
      };
      memoryStore.payments.unshift(payment);

      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "RECORD_COMMISSION_PAYMENT",
        module: "commission",
        recordId: payment._id,
        details: `${currentUser.name} recorded Rs. ${amount} commission payment to ${paymentData.salespersonName} via ${paymentMethod}`,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, payment });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
