import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    let logs = await getAuditLogs();

    if (currentUser.role !== "ADMIN") {
      logs = logs.filter(
        (l: any) => String(l.userId) === String(currentUser.id) || l.userName === currentUser.name
      );
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
