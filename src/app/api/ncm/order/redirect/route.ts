import { NextRequest, NextResponse } from "next/server";
import { NCMClient } from "@/lib/ncm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.pk || !body.name || !body.phone || !body.address) {
      return NextResponse.json(
        { error: "pk, name, phone, address are required fields for redirecting order" },
        { status: 400 }
      );
    }

    const result = await NCMClient.redirectOrder(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
