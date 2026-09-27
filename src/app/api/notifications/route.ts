import { NextRequest, NextResponse } from "next/server";
import { isMongoConnected, memoryStore } from "@/lib/db";
import { Notification } from "@/lib/models";

export async function GET() {
  try {
    if (isMongoConnected()) {
      const notifications = await Notification.find().sort({ createdAt: -1 }).limit(20).lean();
      return NextResponse.json({ notifications });
    }
    return NextResponse.json({ notifications: memoryStore.notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (isMongoConnected()) {
      await Notification.findByIdAndUpdate(id, { isRead: true });
    } else {
      const item = memoryStore.notifications.find((n: any) => n._id === id);
      if (item) item.isRead = true;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
