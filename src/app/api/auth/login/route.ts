import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const users = await getUsers();

    const inputKey = (email || "").trim().toLowerCase();
    const inputPass = (password || "").trim();

    if (!inputKey || !inputPass) {
      return NextResponse.json(
        { error: "Username/Email and Password are required" },
        { status: 400 }
      );
    }

    // Match user by email, name (username), or mobile number
    const user = users.find((u: any) => {
      const uEmail = (u.email || "").trim().toLowerCase();
      const uName = (u.name || "").trim().toLowerCase();
      const uMobile = (u.mobile || "").trim();
      return uEmail === inputKey || uName === inputKey || uMobile === inputKey;
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please check credentials or contact Admin." },
        { status: 401 }
      );
    }

    // Verify Password set in Admin Panel
    const storedPass = (user.password || "").trim();
    if (storedPass && storedPass !== inputPass) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again or contact Admin to reset password." },
        { status: 401 }
      );
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
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
