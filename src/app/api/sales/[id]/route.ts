import { NextRequest, NextResponse } from "next/server";
import { getSales, isMongoConnected, memoryStore } from "@/lib/db";
import { Sale, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const currentUser = await getCurrentUser();

    if (isMongoConnected()) {
      const sale = await Sale.findById(id);
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

      const oldStatus = sale.status;
      if (body.status) sale.status = body.status;
      if (body.remark) sale.remark = body.remark;
      sale.updatedAt = new Date();
      await sale.save();

      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "UPDATE_SALE_STATUS",
        module: "sales",
        recordId: sale.saleId,
        details: `${currentUser.name} updated sale #${sale.saleId} status from ${oldStatus} to ${sale.status}`,
      });

      return NextResponse.json({ success: true, sale });
    } else {
      const sale = memoryStore.sales.find((s: any) => s._id === id || s.saleId === id);
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

      const oldStatus = sale.status;
      if (body.status) sale.status = body.status;
      if (body.remark) sale.remark = body.remark;

      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "UPDATE_SALE_STATUS",
        module: "sales",
        recordId: sale.saleId,
        details: `${currentUser.name} updated sale #${sale.saleId} status from ${oldStatus} to ${sale.status}`,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, sale });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (isMongoConnected()) {
      const sale = await Sale.findById(id);
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

      sale.status = "CANCELLED";
      await sale.save();

      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CANCEL_SALE",
        module: "sales",
        recordId: sale.saleId,
        details: `${currentUser.name} cancelled sale #${sale.saleId}`,
      });

      return NextResponse.json({ success: true, sale });
    } else {
      const sale = memoryStore.sales.find((s: any) => s._id === id || s.saleId === id);
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

      sale.status = "CANCELLED";
      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CANCEL_SALE",
        module: "sales",
        recordId: sale.saleId,
        details: `${currentUser.name} cancelled sale #${sale.saleId}`,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, sale });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
