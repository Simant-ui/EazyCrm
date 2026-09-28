import { NextRequest, NextResponse } from "next/server";
import { getSales, getUsers, getPayments, getAuditLogs } from "@/lib/db";
import { getCommissions } from "@/lib/commission-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const memberId = searchParams.get("memberId") || "ALL";

    let sales = await getSales();
    let users = await getUsers();
    let payments = await getPayments();
    let commissions = await getCommissions();
    let auditLogs = await getAuditLogs();

    // Date filtering
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      if (endDate && !endDate.includes("T")) end.setHours(23, 59, 59, 999);

      sales = sales.filter((s: any) => {
        const d = new Date(s.createdAt || s.updatedAt);
        return d >= start && d <= end;
      });

      payments = payments.filter((p: any) => {
        const d = new Date(p.date || p.createdAt);
        return d >= start && d <= end;
      });

      commissions = commissions.filter((c: any) => {
        const d = new Date(c.deliveredAt || c.createdAt);
        return d >= start && d <= end;
      });
    }

    // Member filtering
    if (memberId && memberId !== "ALL") {
      sales = sales.filter((s: any) => s.salespersonId === memberId || s.salespersonName === memberId);
      payments = payments.filter((p: any) => p.salespersonId === memberId || p.salespersonName === memberId);
      commissions = commissions.filter((c: any) => c.memberId === memberId || c.memberName === memberId);
      users = users.filter((u: any) => u._id === memberId || u.name === memberId);
    }

    // Metrics
    const totalOrders = sales.length;
    const totalSalesAmount = sales.reduce((a: number, s: any) => a + (s.finalAmount || 0), 0);

    const deliveredSales = sales.filter((s: any) => s.status === "DELIVERED" || s.status === "COMPLETED");
    const deliveredOrdersCount = deliveredSales.length;
    const deliveredSalesAmount = deliveredSales.reduce((a: number, s: any) => a + (s.finalAmount || 0), 0);

    const pendingOrdersCount = sales.filter(
      (s: any) => s.status !== "DELIVERED" && s.status !== "COMPLETED" && s.status !== "CANCELLED"
    ).length;

    const cancelledOrdersCount = sales.filter((s: any) => s.status === "CANCELLED").length;

    const totalCommEarned = commissions
      .filter((c: any) => c.status !== "REVERSED")
      .reduce((a: number, c: any) => a + (c.commissionAmount || 0), 0);

    const totalCommPaid = payments.reduce((a: number, p: any) => a + (p.amount || 0), 0);
    const totalCommDue = Math.max(0, totalCommEarned - totalCommPaid);

    // Build Member Summary Rows
    const memberSummaryRows = users
      .map((u: any) => {
        const uSales = sales.filter((s: any) => s.salespersonId === u._id || s.salespersonName === u.name);
        const uDelivered = uSales.filter((s: any) => s.status === "DELIVERED" || s.status === "COMPLETED");
        const uTotSales = uSales.reduce((a: number, s: any) => a + (s.finalAmount || 0), 0);
        const uDelivSales = uDelivered.reduce((a: number, s: any) => a + (s.finalAmount || 0), 0);
        const uCommEarned = commissions
          .filter(
            (c: any) =>
              (c.memberId === u._id || c.memberName === u.name) && c.status !== "REVERSED"
          )
          .reduce((a: number, c: any) => a + (c.commissionAmount || 0), 0);
        const uCommPaid = payments
          .filter((p: any) => p.salespersonId === u._id || p.salespersonName === u.name)
          .reduce((a: number, p: any) => a + (p.amount || 0), 0);
        const uCommDue = Math.max(0, uCommEarned - uCommPaid);

        return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${u.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Rs. ${uTotSales.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Rs. ${uDelivSales.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${uSales.length}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${uDelivered.length}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${u.commissionRate || 5}%</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #059669; font-weight: bold;">Rs. ${uCommEarned.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #2563eb;">Rs. ${uCommPaid.toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #d97706; font-weight: bold;">Rs. ${uCommDue.toLocaleString()}</td>
        </tr>
      `;
      })
      .join("");

    // Build Order Rows
    const orderRows = sales
      .slice(0, 50)
      .map((s: any) => {
        const commRec = commissions.find((c: any) => c.orderId === s.saleId);
        const commAmt = commRec ? commRec.commissionAmount : 0;
        const commRate = commRec ? commRec.commissionRate : 5;
        const commStatus = s.status === "DELIVERED" || s.status === "COMPLETED" ? "Earned" : "Not Eligible (Un-delivered)";

        return `
        <tr>
          <td style="padding: 6px; border: 1px solid #eee; font-weight: bold;">#${s.saleId}</td>
          <td style="padding: 6px; border: 1px solid #eee;">${new Date(s.createdAt).toLocaleDateString()}</td>
          <td style="padding: 6px; border: 1px solid #eee;">${s.salespersonName}</td>
          <td style="padding: 6px; border: 1px solid #eee;">${s.customerName}</td>
          <td style="padding: 6px; border: 1px solid #eee;">Rs. ${(s.finalAmount || 0).toLocaleString()}</td>
          <td style="padding: 6px; border: 1px solid #eee;"><span style="padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: bold;">${s.status}</span></td>
          <td style="padding: 6px; border: 1px solid #eee; text-align: center;">${commRate}%</td>
          <td style="padding: 6px; border: 1px solid #eee; font-weight: bold;">Rs. ${commAmt.toLocaleString()}</td>
          <td style="padding: 6px; border: 1px solid #eee; font-size: 11px;">${commStatus}</td>
        </tr>
      `;
      })
      .join("");

    const currentDateStr = new Date().toLocaleString();
    const periodStr = startDate && endDate ? `${startDate} to ${endDate}` : "All Time / Current Month";

    // Complete Printable HTML Report Document matching exact specification
    const pdfHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>EAZY CRM - Sales & Commission Audit Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 30px; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { margin: 0; color: #059669; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header h3 { margin: 5px 0 0 0; color: #475569; font-size: 14px; font-weight: 500; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 18px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; display: flex; justify-content: space-between; }
          .section-title { font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 25px; margin-bottom: 10px; border-left: 4px solid #059669; padding-left: 8px; text-transform: uppercase; }
          .summary-cards { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
          .card { flex: 1; min-width: 130px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; }
          .card .val { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          .card .lbl { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
          th { background: #059669; color: #ffffff; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; border: 1px solid #047857; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div className="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <h1>EAZY CRM</h1>
          <h3>Sales & Member Commission Audit Report</h3>
        </div>

        <div class="meta-box">
          <div><strong>Report Period:</strong> ${periodStr}</div>
          <div><strong>Generated Date:</strong> ${currentDateStr}</div>
          <div><strong>Member Filter:</strong> ${memberId === "ALL" ? "All Members" : memberId}</div>
        </div>

        <div class="section-title">1. Sales Summary</div>
        <div class="summary-cards">
          <div class="card">
            <div class="lbl">Total Orders</div>
            <div class="val">${totalOrders}</div>
          </div>
          <div class="card">
            <div class="lbl">Total Sales</div>
            <div class="val">Rs. ${totalSalesAmount.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="lbl">Delivered Orders</div>
            <div class="val" style="color: #059669;">${deliveredOrdersCount}</div>
          </div>
          <div class="card">
            <div class="lbl">Delivered Sales</div>
            <div class="val" style="color: #059669;">Rs. ${deliveredSalesAmount.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="lbl">Pending Orders</div>
            <div class="val" style="color: #d97706;">${pendingOrdersCount}</div>
          </div>
          <div class="card">
            <div class="lbl">Cancelled Orders</div>
            <div class="val" style="color: #dc2626;">${cancelledOrdersCount}</div>
          </div>
        </div>

        <div class="section-title">2. Commission Summary</div>
        <div class="summary-cards">
          <div class="card" style="background: #ecfdf5; border-color: #a7f3d0;">
            <div class="lbl" style="color: #047857;">Total Earned Commission (Delivered Only)</div>
            <div class="val" style="color: #047857;">Rs. ${totalCommEarned.toLocaleString()}</div>
          </div>
          <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
            <div class="lbl" style="color: #1d4ed8;">Total Paid Commission</div>
            <div class="val" style="color: #1d4ed8;">Rs. ${totalCommPaid.toLocaleString()}</div>
          </div>
          <div class="card" style="background: #fffbeb; border-color: #fde68a;">
            <div class="lbl" style="color: #b45309;">Total Outstanding / Due</div>
            <div class="val" style="color: #b45309;">Rs. ${totalCommDue.toLocaleString()}</div>
          </div>
        </div>

        <div class="section-title">3. Member-Wise Sales & Commission Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Total Sales</th>
              <th>Delivered Sales</th>
              <th>Orders</th>
              <th>Delivered</th>
              <th>Comm %</th>
              <th>Comm Earned</th>
              <th>Comm Paid</th>
              <th>Comm Due</th>
            </tr>
          </thead>
          <tbody>
            ${memberSummaryRows || `<tr><td colspan="9" style="text-align:center; padding: 10px;">No member sales recorded</td></tr>`}
          </tbody>
        </table>

        <div class="section-title">4. Order-Level Details (Latest 50 Orders)</div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Member</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Rate</th>
              <th>Commission</th>
              <th>Eligibility</th>
            </tr>
          </thead>
          <tbody>
            ${orderRows || `<tr><td colspan="9" style="text-align:center; padding: 10px;">No sales records found</td></tr>`}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by <strong>Eazy CRM Audit Engine</strong> &bull; Confidential Business Document &bull; ${currentDateStr}
        </div>
      </body>
      </html>
    `;

    return new NextResponse(pdfHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
