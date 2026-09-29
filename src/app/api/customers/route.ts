import { NextRequest, NextResponse } from "next/server";
import { getCustomers, getUsers, connectDB, isMongoConnected, memoryStore } from "@/lib/db";
import { Customer, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const currentUser = await getCurrentUser();
    let customers = await getCustomers();

    // Role-based data scoping: Non-admin users only see their own assigned customers!
    if (currentUser.role !== "ADMIN") {
      customers = customers.filter(
        (c: any) =>
          String(c.salespersonId) === String(currentUser.id) ||
          c.salespersonName === currentUser.name
      );
    }

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c: any) =>
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const currentUser = await getCurrentUser();
    const body = await req.json();

    const { name, mobile, email = "", address = "", salespersonId, salespersonName } = body;

    if (!name || !mobile) {
      return NextResponse.json({ error: "Name and mobile are required" }, { status: 400 });
    }

    const users = await getUsers();
    const assignedUser = users.find((u: any) => u._id === salespersonId || u.name === salespersonName) || {
      _id: salespersonId || currentUser.id,
      name: salespersonName || currentUser.name,
    };

    const customerData = {
      name,
      mobile,
      email,
      address,
      salespersonId: assignedUser._id,
      salespersonName: assignedUser.name,
      totalOrders: 0,
      totalUnits: 0,
      totalSpent: 0,
      lastPurchaseDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongoConnected()) {
      const customer = await Customer.create(customerData);
      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_CUSTOMER",
        module: "customers",
        recordId: String(customer._id),
        details: `${currentUser.name} created customer ${name} (${mobile})`,
      });
      return NextResponse.json({ success: true, customer });
    } else {
      const custWithId = { _id: `cust_${Date.now()}`, ...customerData };
      memoryStore.customers.unshift(custWithId);
      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_CUSTOMER",
        module: "customers",
        recordId: custWithId._id,
        details: `${currentUser.name} created customer ${name} (${mobile})`,
        createdAt: new Date(),
      });
      return NextResponse.json({ success: true, customer: custWithId });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
