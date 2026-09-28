import { NextRequest, NextResponse } from "next/server";
import { connectDB, isMongoConnected, memoryStore } from "@/lib/db";
import { User, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const currentUser = await getCurrentUser();

    if (isMongoConnected()) {
      const user = await User.findById(id);
      if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

      if (body.name) user.name = body.name;
      if (body.mobile) user.mobile = body.mobile;
      if (body.email) user.email = body.email;
      if (body.role) user.role = body.role;
      if (body.department) user.department = body.department;
      if (body.status) user.status = body.status;
      if (body.permissions) user.permissions = body.permissions;
      if (body.password) user.password = body.password; // Admin password reset

      user.updatedAt = new Date();
      await user.save();

      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: body.password ? "RESET_PASSWORD" : "UPDATE_TEAM_MEMBER",
        module: "team",
        recordId: String(user._id),
        details: body.password
          ? `${currentUser.name} reset password for member ${user.name}`
          : `${currentUser.name} updated member ${user.name} details`,
      });

      return NextResponse.json({ success: true, user });
    } else {
      const user = memoryStore.users.find((u: any) => u._id === id);
      if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

      if (body.name) user.name = body.name;
      if (body.mobile) user.mobile = body.mobile;
      if (body.email) user.email = body.email;
      if (body.role) user.role = body.role;
      if (body.department) user.department = body.department;
      if (body.status) user.status = body.status;
      if (body.permissions) user.permissions = body.permissions;
      if (body.password) user.password = body.password;

      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: body.password ? "RESET_PASSWORD" : "UPDATE_TEAM_MEMBER",
        module: "team",
        recordId: user._id,
        details: body.password
          ? `${currentUser.name} reset password for member ${user.name}`
          : `${currentUser.name} updated member ${user.name} details`,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, user });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (isMongoConnected()) {
      const user = await User.findById(id);
      if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

      await User.findByIdAndDelete(id);

      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "DELETE_TEAM_MEMBER",
        module: "team",
        recordId: id,
        details: `${currentUser.name} deleted team member ${user.name} (${user.email})`,
      });

      return NextResponse.json({ success: true, message: "Member deleted successfully" });
    } else {
      const index = memoryStore.users.findIndex((u: any) => u._id === id);
      if (index === -1) return NextResponse.json({ error: "Member not found" }, { status: 404 });

      const deletedUser = memoryStore.users[index];
      memoryStore.users.splice(index, 1);

      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "DELETE_TEAM_MEMBER",
        module: "team",
        recordId: id,
        details: `${currentUser.name} deleted team member ${deletedUser.name}`,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, message: "Member deleted successfully" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
