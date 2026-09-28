import { NextRequest, NextResponse } from "next/server";
import { NCMClient } from "@/lib/ncm";

export async function POST(req: NextRequest) {
  try {
    const { orders } = await req.json();
    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ error: "orders array is required" }, { status: 400 });
    }

    const result = await NCMClient.getBulkOrderStatuses(orders);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
