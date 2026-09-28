import { NextRequest, NextResponse } from "next/server";
import { ncmConfig, updateNcmConfig, fetchNcmBranches } from "@/lib/ncm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      config: ncmConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SALES_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { apiToken, baseUrl, defaultPickupBranch } = body;

    const updated = updateNcmConfig({
      ...(apiToken !== undefined ? { apiToken } : {}),
      ...(baseUrl !== undefined ? { baseUrl } : {}),
      ...(defaultPickupBranch !== undefined ? { defaultPickupBranch } : {}),
    });

    // Test branches fetching with new config
    const branches = await fetchNcmBranches();

    return NextResponse.json({
      success: true,
      message: "Nepal Can Move settings updated successfully",
      config: updated,
      branchesCount: branches.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
