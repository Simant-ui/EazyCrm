import { NextRequest, NextResponse } from "next/server";
import { getLeads, getUsers, isMongoConnected, memoryStore } from "@/lib/db";
import { Lead, AuditLog } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const salesperson = searchParams.get("salesperson") || "";
    const status = searchParams.get("status") || "";

    let leads = await getLeads();

    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter(
        (l: any) =>
          l.name.toLowerCase().includes(q) ||
          l.mobile.includes(q) ||
          l.source.toLowerCase().includes(q) ||
          l.campaign.toLowerCase().includes(q)
      );
    }

    if (salesperson && salesperson !== "ALL") {
      leads = leads.filter((l: any) => l.salespersonName === salesperson || l.salespersonId === salesperson);
    }

    if (status && status !== "ALL") {
      leads = leads.filter((l: any) => l.status === status);
    }

    return NextResponse.json({ leads });
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
      mobile,
      email = "",
      source = "Meta Ads",
      campaign = "Dashain Special Promo 2026",
      adSet = "",
      ad = "",
      salespersonId,
      salespersonName,
      status = "NEW",
      nextFollowUpDate,
      initialNote,
    } = body;

    if (!name || !mobile) {
      return NextResponse.json({ error: "Lead name and mobile are required" }, { status: 400 });
    }

    const users = await getUsers();
    const assignedUser = users.find((u: any) => u._id === salespersonId || u.name === salespersonName) || {
      _id: salespersonId || currentUser.id,
      name: salespersonName || currentUser.name,
    };

    const notesArr = initialNote
      ? [{ author: currentUser.name, text: initialNote, createdAt: new Date() }]
      : [];

    const timelineArr = [
      {
        title: "Lead Created",
        description: `Lead created and assigned to ${assignedUser.name}`,
        user: currentUser.name,
        timestamp: new Date(),
      },
    ];

    const leadData = {
      name,
      mobile,
      email,
      source,
      campaign,
      adSet,
      ad,
      salespersonId: assignedUser._id,
      salespersonName: assignedUser.name,
      status,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
      notes: notesArr,
      followUps: nextFollowUpDate
        ? [{ date: new Date(nextFollowUpDate), note: initialNote || "Initial follow up", status: "PENDING" }]
        : [],
      timeline: timelineArr,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongoConnected()) {
      const lead = await Lead.create(leadData);
      await AuditLog.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_LEAD",
        module: "leads",
        recordId: String(lead._id),
        details: `${currentUser.name} created lead ${name} (${mobile}) assigned to ${assignedUser.name}`,
      });
      return NextResponse.json({ success: true, lead });
    } else {
      const leadWithId = { _id: `lead_${Date.now()}`, ...leadData };
      memoryStore.leads.unshift(leadWithId);
      memoryStore.auditLogs.unshift({
        _id: `log_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: "CREATE_LEAD",
        module: "leads",
        recordId: leadWithId._id,
        details: `${currentUser.name} created lead ${name} (${mobile}) assigned to ${assignedUser.name}`,
        createdAt: new Date(),
      });
      return NextResponse.json({ success: true, lead: leadWithId });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
