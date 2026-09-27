import { NextRequest, NextResponse } from "next/server";
import { createNcmOrder, getNcmOrderStatus, getNcmOrderDetails } from "@/lib/ncm";
import { getSales, isMongoConnected, memoryStore } from "@/lib/db";
import { Sale, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

// Create NCM Order for existing sale or check status
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();
    const { saleId, destinationBranch, pickupBranch, deliveryType, weight, instruction } = body;

    if (!saleId || !destinationBranch) {
      return NextResponse.json({ error: "saleId and destinationBranch are required" }, { status: 400 });
    }

    const sales = await getSales();
    const sale = sales.find((s: any) => s._id === saleId || s.saleId === saleId);

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const ncmResult = await createNcmOrder({
      name: sale.customerName,
      phone: sale.customerMobile,
      cod_charge: sale.finalAmount,
      address: sale.customerAddress || "Kathmandu, Nepal",
      fbranch: pickupBranch || "TINKUNE",
      branch: destinationBranch,
      package: sale.product,
      vref_id: sale.saleId,
      instruction: instruction || sale.remark || "Handle with care",
      delivery_type: deliveryType || "Door2Door",
      weight: weight || 1,
    });

    if (!ncmResult.success) {
      return NextResponse.json(
        {
          error: ncmResult.error || "Failed to create NCM order",
          rawResponse: ncmResult.rawResponse,
        },
        { status: 400 }
      );
    }

    // Update sale record with NCM details
    const ncmData = {
      isNcmOrder: true,
      ncmOrderId: String(ncmResult.orderid),
      ncmBranch: destinationBranch,
      ncmPickupBranch: pickupBranch || "TINKUNE",
      ncmDeliveryType: deliveryType || "Door2Door",
      ncmStatus: "Pickup Order Created",
      ncmInstruction: instruction || "",
      status: "SHIPPED", // Update status to SHIPPED
    };

    if (isMongoConnected()) {
      await Sale.findByIdAndUpdate(sale._id, ncmData);
      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_NCM_ORDER",
        module: "sales",
        recordId: sale.saleId,
        details: `${currentUser.name} created Nepal Can Move order #${ncmResult.orderid} for sale ${sale.saleId} (Destination: ${destinationBranch})`,
      });
    } else {
      const targetSale: any = memoryStore.sales.find((s: any) => s._id === sale._id || s.saleId === sale.saleId);
      if (targetSale) {
        Object.assign(targetSale, ncmData);
      }
      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_NCM_ORDER",
        module: "sales",
        recordId: sale.saleId,
        details: `${currentUser.name} created Nepal Can Move order #${ncmResult.orderid} for sale ${sale.saleId} (Destination: ${destinationBranch})`,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Nepal Can Move Order #${ncmResult.orderid} created successfully!`,
      orderid: ncmResult.orderid,
      ncmData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create NCM order" }, { status: 500 });
  }
}

// GET NCM order status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ncmOrderId = searchParams.get("ncmOrderId");

    if (!ncmOrderId) {
      return NextResponse.json({ error: "ncmOrderId is required" }, { status: 400 });
    }

    const [statusRes, detailsRes] = await Promise.all([
      getNcmOrderStatus(ncmOrderId),
      getNcmOrderDetails(ncmOrderId),
    ]);

    return NextResponse.json({
      success: true,
      ncmOrderId,
      statusHistory: statusRes.data || [],
      details: detailsRes.data || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch NCM status" }, { status: 500 });
  }
}
