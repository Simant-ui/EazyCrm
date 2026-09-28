import { isMongoConnected, memoryStore } from "@/lib/db";
import { Sale, User, CommissionPayment, AuditLog } from "@/lib/models";
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommissionRecord extends Document {
  _id: any;
  orderId: string;
  memberId: string;
  memberName: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "EARNED" | "PARTIALLY_PAID" | "PAID" | "REVERSED" | "ADJUSTED";
  deliveredAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionRecordSchema = new Schema<ICommissionRecord>(
  {
    orderId: { type: String, required: true, unique: true },
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    saleAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["EARNED", "PARTIALLY_PAID", "PAID", "REVERSED", "ADJUSTED"],
      default: "EARNED",
    },
    deliveredAt: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const CommissionRecord: Model<ICommissionRecord> =
  mongoose.models.CommissionRecord ||
  mongoose.model<ICommissionRecord>("CommissionRecord", CommissionRecordSchema);

// Memory store commissions list fallback
export let memoryCommissions: any[] = [];

/**
 * CORE COMMISSION ENGINE
 * Automatically called whenever an order status changes.
 * ONLY DELIVERED ORDERS generate commission.
 */
export async function calculateAndSaveCommissionForSale(saleObj: any) {
  const isDelivered = saleObj.status === "DELIVERED" || saleObj.status === "COMPLETED";

  if (!isDelivered) {
    // If an order was previously delivered but changed to CANCELLED/RETURNED later, handle reversal!
    if (saleObj.status === "CANCELLED" || saleObj.status === "RETURNED") {
      await handleCommissionReversal(saleObj);
    }
    return { eligible: false, message: "Order status is not DELIVERED. Commission is 0." };
  }

  // Check if commission already exists for this orderId (Safety against duplicate generation)
  if (isMongoConnected()) {
    const existing = await CommissionRecord.findOne({ orderId: saleObj.saleId });
    if (existing) {
      return { eligible: true, duplicate: true, commission: existing };
    }

    // Resolve member's commission rate from User model or fallback to 5% or sale unitCommission
    const member = await User.findById(saleObj.salespersonId);
    let commissionRate = 5; // default 5%
    if (member && (member as any).commissionRate) {
      commissionRate = Number((member as any).commissionRate);
    } else if (saleObj.totalCommission && saleObj.finalAmount) {
      commissionRate = Number(((saleObj.totalCommission / saleObj.finalAmount) * 100).toFixed(2));
    }

    const saleAmount = Number(saleObj.finalAmount || saleObj.subtotal || 0);
    const commissionAmount = Number(
      saleObj.totalCommission || ((saleAmount * commissionRate) / 100).toFixed(2)
    );

    const record = await CommissionRecord.create({
      orderId: saleObj.saleId,
      memberId: saleObj.salespersonId,
      memberName: saleObj.salespersonName || "Sales Executive",
      saleAmount,
      commissionRate,
      commissionAmount,
      status: "EARNED",
      deliveredAt: new Date(),
    });

    await AuditLog.create({
      userId: "SYSTEM_COMMISSION_ENGINE",
      userName: "Commission Engine",
      userRole: "SYSTEM",
      action: "COMMISSION_GENERATED",
      module: "commission",
      recordId: saleObj.saleId,
      details: `Generated Rs. ${commissionAmount} commission (${commissionRate}%) for delivered sale #${saleObj.saleId} assigned to ${saleObj.salespersonName}`,
    });

    return { eligible: true, duplicate: false, commission: record };
  } else {
    // Memory store fallback
    const existing = memoryCommissions.find((c: any) => c.orderId === saleObj.saleId);
    if (existing) return { eligible: true, duplicate: true, commission: existing };

    const commissionRate = 5;
    const saleAmount = Number(saleObj.finalAmount || saleObj.subtotal || 0);
    const commissionAmount = Number(
      saleObj.totalCommission || ((saleAmount * commissionRate) / 100).toFixed(2)
    );

    const record = {
      _id: `comm_${Date.now()}`,
      orderId: saleObj.saleId,
      memberId: saleObj.salespersonId,
      memberName: saleObj.salespersonName || "Sales Executive",
      saleAmount,
      commissionRate,
      commissionAmount,
      status: "EARNED",
      deliveredAt: new Date(),
      createdAt: new Date(),
    };

    memoryCommissions.push(record);
    return { eligible: true, duplicate: false, commission: record };
  }
}

/**
 * Reversal / Adjustment if a delivered order is returned/cancelled later
 */
async function handleCommissionReversal(saleObj: any) {
  if (isMongoConnected()) {
    const record = await CommissionRecord.findOne({ orderId: saleObj.saleId });
    if (record && record.status !== "REVERSED") {
      record.status = "REVERSED";
      record.notes = `Reversed due to order status change to ${saleObj.status}`;
      await record.save();

      await AuditLog.create({
        userId: "SYSTEM_COMMISSION_ENGINE",
        userName: "Commission Engine",
        userRole: "SYSTEM",
        action: "COMMISSION_REVERSED",
        module: "commission",
        recordId: saleObj.saleId,
        details: `Reversed Rs. ${record.commissionAmount} commission for sale #${saleObj.saleId} because status changed to ${saleObj.status}`,
      });
    }
  } else {
    const record = memoryCommissions.find((c: any) => c.orderId === saleObj.saleId);
    if (record) {
      record.status = "REVERSED";
      record.notes = `Reversed due to status ${saleObj.status}`;
    }
  }
}

/**
 * Fetch all commissions with optional filters
 */
export async function getCommissions(memberId?: string) {
  if (isMongoConnected()) {
    const query = memberId ? { memberId } : {};
    return await CommissionRecord.find(query).sort({ createdAt: -1 }).lean();
  }
  if (memberId) {
    return memoryCommissions.filter((c: any) => c.memberId === memberId);
  }
  return memoryCommissions;
}
