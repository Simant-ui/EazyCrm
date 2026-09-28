import { NextRequest, NextResponse } from "next/server";
import { NCMClient } from "@/lib/ncm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creation = searchParams.get("creation") || "TINKUNE";
    const destination = searchParams.get("destination") || "POKHARA";
    const type = (searchParams.get("type") as any) || "Pickup/Collect";

    const result = await NCMClient.getShippingRate(creation, destination, type);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
