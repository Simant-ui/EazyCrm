import { NextRequest, NextResponse } from "next/server";
import { NCMClient } from "@/lib/ncm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.bankName) {
      // COD transfer ticket
      const result = await NCMClient.createCODTransferTicket(body);
      return NextResponse.json(result);
    } else {
      // Generic vendor ticket
      const result = await NCMClient.createVendorTicket(body);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
