import { NextRequest, NextResponse } from "next/server";
import { getUsers, connectDB } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { email, userId, role, identifier } = body;
    const users = await getUsers();

    const inputKey = String(email || userId || role || identifier || "").trim().toLowerCase();

    if (!inputKey) {
      return NextResponse.json({ error: "No user identifier provided" }, { status: 400 });
    }

    // Match by email, id, name, or role
    let user = users.find((u: any) => {
      const uEmail = (u.email || "").trim().toLowerCase();
      const uId = String(u._id || "").trim().toLowerCase();
      const uName = (u.name || "").trim().toLowerCase();
      const uRole = (u.role || "").trim().toLowerCase();
      return (
        uEmail === inputKey ||
        uId === inputKey ||
        uName === inputKey ||
        uRole === inputKey ||
        uName.startsWith(inputKey)
      );
    });

    // Fallback: substring role match (admin, manager, executive)
    if (!user && (inputKey.includes("admin") || inputKey.includes("executive") || inputKey.includes("manager"))) {
      user = users.find((u: any) => (u.role || "").toLowerCase().includes(inputKey));
    }

    if (!user) {
      return NextResponse.json({ error: `User account '${inputKey}' not found` }, { status: 404 });
    }

    const sessionUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role || "SALES_EXECUTIVE",
      department: user.department || "Sales",
      avatarUrl: user.avatarUrl || "",
      permissions: user.permissions || {},
    };

    const token = await createSessionToken(sessionUser);

    const res = NextResponse.json({ success: true, user: sessionUser });
    res.cookies.set("eazybox_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Switch user failed" }, { status: 500 });
  }
}

