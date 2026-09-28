import { NextRequest, NextResponse } from "next/server";
import { NCMClient } from "@/lib/ncm";

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '"ids" must be a non-empty array' }, { status: 400 });
    }

    const result = await NCMClient.getBulkOrderLabels(ids);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
