import { NextRequest, NextResponse } from "next/server";
import { getSales, isMongoConnected, memoryStore } from "@/lib/db";
import { Sale, AuditLog } from "@/lib/models";
import { calculateAndSaveCommissionForSale } from "@/lib/commission-engine";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("Received NCM Webhook Event:", payload);

    const { order_id, status, test } = payload;

    if (test) {
      return NextResponse.json({ success: true, message: "Test webhook received successfully" });
    }

    if (!order_id || !status) {
      return NextResponse.json({ error: "order_id and status are required" }, { status: 400 });
    }

    // Process webhook order status update
    if (isMongoConnected()) {
      const sale = await Sale.findOne({
        $or: [{ ncmOrderId: String(order_id) }, { saleId: String(order_id) }],
      });

      if (sale) {
        const oldStatus = sale.status;
        sale.ncmStatus = status;

        if (status === "Delivered" || status === "Completed") {
          sale.status = "DELIVERED";
          await calculateAndSaveCommissionForSale(sale);
        } else if (status === "Cancelled" || status === "Returned") {
          sale.status = status === "Cancelled" ? "CANCELLED" : "CANCELLED";
        }

        await sale.save();

        await AuditLog.create({
          userId: "NCM_WEBHOOK",
          userName: "NCM System Webhook",
          userRole: "SYSTEM",
          action: "WEBHOOK_ORDER_STATUS_UPDATE",
          module: "sales",
          recordId: sale.saleId,
          details: `NCM Webhook updated order #${sale.saleId} (NCM #${order_id}) status to ${status}`,
        });
      }
    } else {
      const sale = memoryStore.sales.find(
        (s: any) => String(s.ncmOrderId) === String(order_id) || String(s.saleId) === String(order_id)
      );

      if (sale) {
        sale.ncmStatus = status;
        if (status === "Delivered" || status === "Completed") {
          sale.status = "DELIVERED";
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
