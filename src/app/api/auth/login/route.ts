import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const users = await getUsers();

    const inputKey = (email || "").trim().toLowerCase();

    // Match user by email or mobile number
    const user = users.find(
      (u: any) =>
        u.email?.toLowerCase() === inputKey ||
        u.mobile?.trim() === inputKey
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username/email or user not found. Please contact Admin." },
        { status: 401 }
      );
    }

    // Verify Password if user has a password set
    if (user.password && password && user.password !== password) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again or contact Admin to reset password." },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      department: user.department,
      avatarUrl: user.avatarUrl,
      permissions: user.permissions,
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
