import { NextRequest, NextResponse } from "next/server";
import { getUsers, isMongoConnected, memoryStore } from "@/lib/db";
import { User, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();

    const {
      name,
      email,
      mobile,
      password = "Password@123",
      role = "SALES_EXECUTIVE",
      department = "Sales",
      status = "ACTIVE",
      avatarUrl = "",
      permissions = {},
    } = body;

    if (!name || !email || !mobile) {
      return NextResponse.json({ error: "Name, email, and mobile are required" }, { status: 400 });
    }

    const userData = {
      name,
      email,
      mobile,
      password,
      role,
      department,
      status,
      avatarUrl,
      permissions,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongoConnected()) {
      const newUser = await User.create(userData);
      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "ADD_TEAM_MEMBER",
        module: "team",
        recordId: String(newUser._id),
        details: `${currentUser.name} added team member ${name} (${role}, ${department})`,
      });
      return NextResponse.json({ success: true, user: newUser });
    } else {
      const userWithId = { _id: `user_${Date.now()}`, ...userData };
      memoryStore.users.push(userWithId);
      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "ADD_TEAM_MEMBER",
        module: "team",
        recordId: userWithId._id,
        details: `${currentUser.name} added team member ${name} (${role}, ${department})`,
        createdAt: new Date(),
      });
      return NextResponse.json({ success: true, user: userWithId });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
