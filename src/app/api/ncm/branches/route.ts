import { NextRequest, NextResponse } from "next/server";
import { fetchNcmBranches } from "@/lib/ncm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || undefined;
    const baseUrl = searchParams.get("baseUrl") || undefined;

    const branches = await fetchNcmBranches(token, baseUrl);
    return NextResponse.json({ success: true, branches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch branches" }, { status: 500 });
  }
}
