import { NextRequest, NextResponse } from "next/server";
import { connectDB, isMongoConnected, memoryStore } from "@/lib/db";
import { Sale, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { createNcmOrder } from "@/lib/ncm";
import { calculateAndSaveCommissionForSale } from "@/lib/commission-engine";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const currentUser = await getCurrentUser();

    if (isMongoConnected()) {
      const sale = await Sale.findById(id) || await Sale.findOne({ saleId: id });
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

      const oldStatus = sale.status;
      if (body.status) sale.status = body.status;
      if (body.remark) sale.remark = body.remark;

      // Rule: Trigger NCM creation when status is updated to CONFIRMED if NCM order doesn't exist yet
      if (
        (body.status === "CONFIRMED" || body.status === "SHIPPED") &&
        !sale.ncmOrderId &&
        sale.ncmBranch
      ) {
        const ncmResult = await createNcmOrder({
          name: sale.customerName,
          phone: sale.customerMobile,
          cod_charge: sale.finalAmount,
          address: sale.customerAddress || "Kathmandu, Nepal",
          fbranch: sale.ncmPickupBranch || "TINKUNE",
          branch: sale.ncmBranch,
          package: sale.product,
          vref_id: sale.saleId,
          instruction: sale.ncmInstruction || sale.remark || "Handle with care",
          delivery_type: (sale.ncmDeliveryType as any) || "Door2Door",
          weight: sale.ncmWeight || "1",
        });

        if (ncmResult.success && ncmResult.orderid) {
          sale.isNcmOrder = true;
          sale.ncmOrderId = String(ncmResult.orderid);
          sale.ncmStatus = "Pickup Order Created";
          sale.status = "SHIPPED";
        } else if (ncmResult.error) {
          const errText = String(ncmResult.error);
          sale.ncmStatus = errText.toLowerCase().includes("token")
            ? "NCM Token Invalid - Set valid token in NCM Settings"
            : `Failed: ${errText}`;
        }
      }

      // Rule: Trigger Commission Engine ONLY IF status is DELIVERED or COMPLETED
      if ((sale.status as string) === "DELIVERED" || (sale.status as string) === "COMPLETED") {
        await calculateAndSaveCommissionForSale(sale);
      } else if ((sale.status as string) === "CANCELLED" || (sale.status as string) === "RETURNED") {
        await calculateAndSaveCommissionForSale(sale); // triggers reversal inside engine
      }

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

      if (sale.status === "DELIVERED" || sale.status === "COMPLETED") {
        await calculateAndSaveCommissionForSale(sale);
      } else if (sale.status === "CANCELLED" || sale.status === "RETURNED") {
        await calculateAndSaveCommissionForSale(sale);
      }

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
    await connectDB();
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (isMongoConnected()) {
      const sale = await Sale.findById(id) || await Sale.findOne({ saleId: id });
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

      sale.status = "CANCELLED";
      await calculateAndSaveCommissionForSale(sale);
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
      await calculateAndSaveCommissionForSale(sale);
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
