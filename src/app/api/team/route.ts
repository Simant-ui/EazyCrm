import { NextRequest, NextResponse } from "next/server";
import { getUsers, connectDB, isMongoConnected, memoryStore } from "@/lib/db";
import { User, AuditLog } from "@/lib/models";
import { getCurrentUser, requirePermission } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { allowed } = await requirePermission("team", "view");
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Access Denied: You do not have permission to view team members." }, { status: 403 });
    }
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, user: currentUser } = await requirePermission("team", "create");
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Access Denied: You do not have permission to create team members." }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();

    const {
      name,
      email,
      mobile,
      password = "Password@123",
      role = "MEMBER",
      department = "Sales",
      status = "ACTIVE",
      avatarUrl = "",
      permissions = {},
    } = body;

    if (!name || !email || !mobile) {
      return NextResponse.json({ error: "Name, email, and mobile are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    const newId = new mongoose.Types.ObjectId().toString();
    const userData = {
      _id: newId,
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password: password.trim(),
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
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return NextResponse.json({ error: `A user with email '${cleanEmail}' already exists.` }, { status: 400 });
      }

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

      // Send welcome email via Gmail SMTP asynchronously
      sendWelcomeEmail(cleanEmail, name.trim(), role, password.trim()).catch(() => {});

      return NextResponse.json({ success: true, user: newUser });
    } else {
      const existing = memoryStore.users.find((u: any) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return NextResponse.json({ error: `A user with email '${cleanEmail}' already exists.` }, { status: 400 });
      }

      const userWithId = userData;
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

      sendWelcomeEmail(cleanEmail, name.trim(), role, password.trim()).catch(() => {});

      return NextResponse.json({ success: true, user: userWithId });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
