import { NextRequest, NextResponse } from "next/server";
import { NCMClient } from "@/lib/ncm";

export async function POST(req: NextRequest) {
  try {
    const { pk, comment } = await req.json();
    if (!pk) return NextResponse.json({ error: "pk (Order ID) is required" }, { status: 400 });

    const result = await NCMClient.returnOrder(pk, comment);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
