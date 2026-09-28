import { NextRequest, NextResponse } from "next/server";
import { NCMClient } from "@/lib/ncm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "order_id parameter missing" }, { status: 400 });

    const result = await NCMClient.getOrderLabel(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
