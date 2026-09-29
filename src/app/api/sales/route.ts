import { NextRequest, NextResponse } from "next/server";
import { getSales, getUsers, getCustomers, connectDB, isMongoConnected, memoryStore } from "@/lib/db";
import { Sale, Customer, AuditLog } from "@/lib/models";
import { calculateCommission } from "@/lib/business";
import { getCurrentUser, requirePermission } from "@/lib/auth";
import { createNcmOrder } from "@/lib/ncm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { allowed, user: currentUser } = await requirePermission("sales", "view");
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Access Denied: You do not have permission to view sales." }, { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const salesperson = searchParams.get("salesperson") || "";
    const status = searchParams.get("status") || "";
    const campaign = searchParams.get("campaign") || "";

    let sales = await getSales();

    // Role-based data scoping: Non-admin users only see their own sales!
    if (currentUser.role !== "ADMIN") {
      sales = sales.filter(
        (s: any) =>
          String(s.salespersonId) === String(currentUser.id) ||
          s.salespersonName === currentUser.name ||
          (currentUser.email && s.salespersonEmail === currentUser.email)
      );
    } else if (salesperson && salesperson !== "ALL") {
      sales = sales.filter((s: any) => s.salespersonName === salesperson || s.salespersonId === salesperson);
    }

    if (search) {
      const q = search.toLowerCase();
      sales = sales.filter(
        (s: any) =>
          s.customerName.toLowerCase().includes(q) ||
          s.customerMobile.includes(q) ||
          s.saleId.toLowerCase().includes(q) ||
          s.product.toLowerCase().includes(q) ||
          (s.ncmOrderId && s.ncmOrderId.includes(q))
      );
    }

    if (status && status !== "ALL") {
      sales = sales.filter((s: any) => s.status === status);
    }

    if (campaign && campaign !== "ALL") {
      sales = sales.filter((s: any) => s.campaign === campaign);
    }

    return NextResponse.json({ sales });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, user: currentUser } = await requirePermission("sales", "create");
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Access Denied: You do not have permission to create sales." }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();

    const {
      customerName,
      customerMobile,
      customerEmail = "",
      customerAddress = "",
      product = "EazyBox POS Hardware Suite",
      quantity = 1,
      sellingPrice = 9000,
      roundOff = 0,
      paymentMethod = "eSewa / Khalti",
      source = "Meta Ads",
      campaign = "Dashain Special Promo 2026",
      adSet = "",
      ad = "",
      salespersonId,
      salespersonName,
      status = "CONFIRMED",
      remark = "",
      // NCM Options
      createNcmOrder: shouldCreateNcm = false,
      ncmBranch = "",
      ncmPickupBranch = "TINKUNE",
      ncmDeliveryType = "Door2Door",
      ncmInstruction = "",
      ncmWeight = "1",
    } = body;

    if (!customerName || !customerMobile) {
      return NextResponse.json({ error: "Customer name and mobile number are required" }, { status: 400 });
    }

    // Auto-calculate commission using business logic rules
    const calc = calculateCommission(Number(quantity), Number(sellingPrice), Number(roundOff));

    // Resolve salesperson details
    const users = await getUsers();
    const assignedUser = users.find((u: any) => u._id === salespersonId || u.name === salespersonName) || {
      _id: salespersonId || currentUser.id,
      name: salespersonName || currentUser.name,
    };

    const nextIdNumber = (await getSales()).length + 1001;
    const saleId = `EZ-${nextIdNumber}`;

    let ncmInfo: any = {
      isNcmOrder: false,
      ncmOrderId: "",
      ncmBranch: ncmBranch || "",
      ncmPickupBranch,
      ncmDeliveryType,
      ncmInstruction,
      ncmWeight: String(ncmWeight || "1"),
      ncmStatus: "",
      ncmResponse: null,
    };

    let finalSaleStatus = status;

    // Trigger Nepal Can Move Order Creation ONLY IF status is CONFIRMED
    const isConfirmedStatus = status === "CONFIRMED" || status === "SHIPPED";
    if (isConfirmedStatus && shouldCreateNcm && ncmBranch) {
      const ncmResult = await createNcmOrder({
        name: customerName,
        phone: customerMobile,
        cod_charge: calc.finalAmount,
        address: customerAddress || "Kathmandu, Nepal",
        fbranch: ncmPickupBranch || "TINKUNE",
        branch: ncmBranch,
        package: product,
        vref_id: saleId,
        instruction: ncmInstruction || remark || "Handle with care",
        delivery_type: ncmDeliveryType as any,
        weight: ncmWeight || "1",
      });

      if (ncmResult.success) {
        ncmInfo.isNcmOrder = true;
        ncmInfo.ncmOrderId = String(ncmResult.orderid);
        ncmInfo.ncmStatus = "Pickup Order Created";
        ncmInfo.ncmResponse = ncmResult.rawResponse || ncmResult;
        finalSaleStatus = "SHIPPED"; // Mark as SHIPPED when NCM order is placed
      } else {
        ncmInfo.isNcmOrder = false;
        ncmInfo.ncmStatus = `Failed: ${ncmResult.error || "NCM API Error"}`;
        ncmInfo.ncmResponse = ncmResult;
      }
    }

    const newSaleData = {
      saleId,
      customerName,
      customerMobile,
      customerEmail,
      customerAddress,
      product,
      quantity: calc.quantity,
      sellingPrice: calc.unitPrice,
      subtotal: calc.subtotal,
      unitCommission: calc.unitCommission,
      totalCommission: calc.totalCommission,
      roundOff: calc.roundOff,
      finalAmount: calc.finalAmount,
      paymentMethod,
      source,
      campaign,
      adSet,
      ad,
      salespersonId: assignedUser._id,
      salespersonName: assignedUser.name,
      status: finalSaleStatus,
      remark,
      ...ncmInfo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongoConnected()) {
      const sale = await Sale.create(newSaleData);

      const newRemarkObj = remark && String(remark).trim() ? {
        text: String(remark).trim(),
        addedBy: currentUser.name,
        saleId: saleId,
        createdAt: new Date(),
      } : null;

      // Create/Update Customer record in MongoDB
      let customer = await Customer.findOne({ mobile: customerMobile });
      if (customer) {
        customer.totalOrders += 1;
        customer.totalUnits += calc.quantity;
        customer.totalSpent += calc.finalAmount;
        customer.lastPurchaseDate = new Date();
        if (newRemarkObj) {
          if (!customer.remarks) customer.remarks = [];
          customer.remarks.push(newRemarkObj);
        }
        await customer.save();
      } else {
        await Customer.create({
          name: customerName,
          mobile: customerMobile,
          email: customerEmail,
          address: customerAddress,
          salespersonId: assignedUser._id,
          salespersonName: assignedUser.name,
          totalOrders: 1,
          totalUnits: calc.quantity,
          totalSpent: calc.finalAmount,
          lastPurchaseDate: new Date(),
          remarks: newRemarkObj ? [newRemarkObj] : [],
        });
      }

      // Create Audit Log
      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_SALE",
        module: "sales",
        recordId: saleId,
        details: `${currentUser.name} created sale #${saleId} for ${customerName} (Rs. ${calc.finalAmount})`,
      });

      return NextResponse.json({ success: true, sale });
    } else {
      const sale = { _id: `sale_${Date.now()}`, ...newSaleData };
      memoryStore.sales.unshift(sale);

      const newRemarkObj = remark && String(remark).trim() ? {
        text: String(remark).trim(),
        addedBy: currentUser.name,
        saleId: saleId,
        createdAt: new Date(),
      } : null;

      let customer = memoryStore.customers.find((c: any) => c.mobile === customerMobile);
      if (customer) {
        customer.totalOrders += 1;
        customer.totalUnits += calc.quantity;
        customer.totalSpent += calc.finalAmount;
        customer.lastPurchaseDate = new Date();
        if (!customer.remarks) customer.remarks = [];
        if (newRemarkObj) {
          customer.remarks.push(newRemarkObj);
        }
      } else {
        memoryStore.customers.unshift({
          _id: `cust_${Date.now()}`,
          name: customerName,
          mobile: customerMobile,
          email: customerEmail,
          address: customerAddress,
          salespersonId: assignedUser._id,
          salespersonName: assignedUser.name,
          totalOrders: 1,
          totalUnits: calc.quantity,
          totalSpent: calc.finalAmount,
          lastPurchaseDate: new Date(),
          remarks: newRemarkObj ? [newRemarkObj] : [],
          createdAt: new Date(),
        });
      }

      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_SALE",
        module: "sales",
        recordId: saleId,
        details: `${currentUser.name} created sale #${saleId} for ${customerName} (Rs. ${calc.finalAmount})`,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, sale });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
