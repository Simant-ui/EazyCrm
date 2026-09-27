import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUsers } from "@/lib/db";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    const users = await getUsers();
    const fullUser = users.find((u) => u._id === sessionUser.id) || sessionUser;

    return NextResponse.json({
      user: {
        id: fullUser._id || sessionUser.id,
        name: fullUser.name,
        email: fullUser.email,
        mobile: fullUser.mobile,
        role: fullUser.role,
        department: fullUser.department,
        avatarUrl: fullUser.avatarUrl,
        permissions: fullUser.permissions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
