import { NextRequest, NextResponse } from "next/server";
import { getProducts, isMongoConnected, memoryStore } from "@/lib/db";
import { Product, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const products = await getProducts();
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();

    const {
      name,
      sku,
      category = "Hardware",
      costPrice = 0,
      sellingPrice = 0,
      unitCommission = 500,
      stock = 10,
      description = "",
      status = "ACTIVE",
    } = body;

    if (!name || !sku || sellingPrice <= 0) {
      return NextResponse.json(
        { error: "Product name, SKU, and a valid selling price are required." },
        { status: 400 }
      );
    }

    const newProdData = {
      name,
      sku,
      category,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      unitCommission: Number(unitCommission),
      stock: Number(stock),
      description,
      status,
    };

    if (isMongoConnected()) {
      const product = await Product.create(newProdData);

      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_PRODUCT",
        module: "products",
        recordId: String(product._id),
        details: `${currentUser.name} created new product '${name}' (Price: Rs. ${sellingPrice})`,
      });

      return NextResponse.json({ success: true, product });
    } else {
      const prodWithId = { _id: `prod_${Date.now()}`, ...newProdData };
      memoryStore.products.unshift(prodWithId);
      return NextResponse.json({ success: true, product: prodWithId });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    if (isMongoConnected()) {
      const product = await Product.findByIdAndUpdate(_id, updateData, { new: true });
      return NextResponse.json({ success: true, product });
    } else {
      const index = memoryStore.products.findIndex((p: any) => p._id === _id);
      if (index !== -1) {
        memoryStore.products[index] = { ...memoryStore.products[index], ...updateData };
        return NextResponse.json({ success: true, product: memoryStore.products[index] });
      }
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}
