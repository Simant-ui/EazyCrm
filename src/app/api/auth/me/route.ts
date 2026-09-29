import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUsers } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const users = await getUsers();
    const fullUser =
      users.find(
        (u: any) =>
          String(u._id) === String(sessionUser.id) ||
          (u.email && sessionUser.email && u.email.toLowerCase() === sessionUser.email.toLowerCase())
      ) || sessionUser;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: String(fullUser._id || sessionUser.id),
        name: fullUser.name || sessionUser.name,
        email: fullUser.email || sessionUser.email,
        mobile: fullUser.mobile || sessionUser.mobile,
        role: fullUser.role || sessionUser.role,
        department: fullUser.department || sessionUser.department,
        avatarUrl: fullUser.avatarUrl || sessionUser.avatarUrl || "",
        permissions: fullUser.permissions || sessionUser.permissions || {},
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

