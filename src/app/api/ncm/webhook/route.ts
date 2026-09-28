import { NextRequest, NextResponse } from "next/server";
import { NCMClient } from "@/lib/ncm";

export async function POST(req: NextRequest) {
  try {
    const { webhook_url, test } = await req.json();

    if (test) {
      const result = await NCMClient.testWebhook(webhook_url);
      return NextResponse.json(result);
    } else {
      const result = await NCMClient.updateWebhook(webhook_url);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
