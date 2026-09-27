import { NextRequest, NextResponse } from "next/server";
import { isMongoConnected, memoryStore } from "@/lib/db";
import { Lead, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const currentUser = await getCurrentUser();

    const { status, note, followUpDate, followUpNote } = body;

    if (isMongoConnected()) {
      const lead = await Lead.findById(id);
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

      const oldStatus = lead.status;

      if (status && status !== oldStatus) {
        lead.status = status;
        lead.timeline.unshift({
          title: "Status Changed",
          description: `Status changed from ${oldStatus} to ${status}`,
          user: currentUser.name,
          timestamp: new Date(),
        });
      }

      if (note) {
        lead.notes.unshift({
          author: currentUser.name,
          text: note,
          createdAt: new Date(),
        });
      }

      if (followUpDate) {
        lead.nextFollowUpDate = new Date(followUpDate);
        lead.followUps.unshift({
          date: new Date(followUpDate),
          note: followUpNote || "Scheduled follow up",
          status: "PENDING",
        });
        lead.timeline.unshift({
          title: "Follow-up Scheduled",
          description: `Follow-up set for ${new Date(followUpDate).toLocaleDateString()}`,
          user: currentUser.name,
          timestamp: new Date(),
        });
      }

      lead.updatedAt = new Date();
      await lead.save();

      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "UPDATE_LEAD",
        module: "leads",
        recordId: String(lead._id),
        details: `${currentUser.name} updated lead ${lead.name} (${status || "details"})`,
      });

      return NextResponse.json({ success: true, lead });
    } else {
      const lead: any = memoryStore.leads.find((l: any) => l._id === id);
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

      const oldStatus = lead.status;

      if (status && status !== oldStatus) {
        lead.status = status;
        if (!lead.timeline) lead.timeline = [];
        (lead.timeline as any[]).unshift({
          title: "Status Changed",
          description: `Status changed from ${oldStatus} to ${status}`,
          user: currentUser.name,
          timestamp: new Date(),
        });
      }

      if (note) {
        if (!lead.notes) lead.notes = [];
        (lead.notes as any[]).unshift({
          author: currentUser.name,
          text: note,
          createdAt: new Date(),
        });
      }

      if (followUpDate) {
        lead.nextFollowUpDate = new Date(followUpDate);
        if (!lead.followUps) lead.followUps = [];
        (lead.followUps as any[]).unshift({
          date: new Date(followUpDate),
          note: followUpNote || "Scheduled follow up",
          status: "PENDING",
        });
        if (!lead.timeline) lead.timeline = [];
        (lead.timeline as any[]).unshift({
          title: "Follow-up Scheduled",
          description: `Follow-up set for ${new Date(followUpDate).toLocaleDateString()}`,
          user: currentUser.name,
          timestamp: new Date(),
        });
      }

      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "UPDATE_LEAD",
        module: "leads",
        recordId: lead._id,
        details: `${currentUser.name} updated lead ${lead.name} (${status || "details"})`,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, lead });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
