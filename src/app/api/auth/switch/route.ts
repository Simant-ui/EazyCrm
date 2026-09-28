import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, userId } = await req.json();
    const users = await getUsers();

    const inputKey = (email || userId || "").trim().toLowerCase();

    const user = users.find((u: any) => {
      const uEmail = (u.email || "").trim().toLowerCase();
      const uId = String(u._id || "").trim().toLowerCase();
      const uName = (u.name || "").trim().toLowerCase();
      return uEmail === inputKey || uId === inputKey || uName === inputKey;
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
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
