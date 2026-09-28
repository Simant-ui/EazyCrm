import { NextRequest, NextResponse } from "next/server";
import { NCMClient } from "@/lib/ncm";

export async function POST(req: NextRequest) {
  try {
    const { pk } = await req.json();
    if (!pk) return NextResponse.json({ error: "pk (Original Order ID) is required" }, { status: 400 });

    const result = await NCMClient.createExchangeOrder(pk);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
