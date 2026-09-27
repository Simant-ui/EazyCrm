import { NextResponse } from "next/server";
import { getCampaigns, getSales, getLeads } from "@/lib/db";

export async function GET() {
  try {
    const campaigns = await getCampaigns();
    const sales = await getSales();
    const leads = await getLeads();

    const totalLeads = leads.length;
    const metaLeads = leads.filter((l: any) => l.source === "Meta Ads").length;
    const convertedLeads = leads.filter((l: any) => l.status === "CONVERTED" || l.status === "CONFIRMED").length;
    const totalSalesCount = sales.filter((s: any) => s.status !== "CANCELLED").length;
    const totalRevenue = sales
      .filter((s: any) => s.status !== "CANCELLED")
      .reduce((acc: number, s: any) => acc + (s.finalAmount || 0), 0);

    const overallConversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      metrics: {
        totalLeads,
        metaLeads,
        convertedLeads,
        totalSalesCount,
        totalRevenue,
        overallConversionRate: Number(overallConversionRate),
      },
      campaigns,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
