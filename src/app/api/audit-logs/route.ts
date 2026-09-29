import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { allowed, user: currentUser } = await requirePermission("audit_logs", "view");
    if (!allowed || !currentUser) {
      return NextResponse.json({ success: false, error: "Access Denied: You do not have permission to view audit logs." }, { status: 403 });
    }
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
