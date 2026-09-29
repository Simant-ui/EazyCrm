import mongoose, { Schema, Document, Model } from "mongoose";

// --- User Schema ---
export interface IUser extends Document {
  _id: any;
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: "ADMIN" | "MEMBER" | "SALES_MANAGER" | "SALES_EXECUTIVE";
  department: string;
  status: "ACTIVE" | "INACTIVE";
  avatarUrl?: string;
  permissions?: Record<string, any>;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "MEMBER", "SALES_MANAGER", "SALES_EXECUTIVE"], default: "MEMBER" },
    department: { type: String, default: "Sales" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    avatarUrl: { type: String, default: "" },
    permissions: { type: Schema.Types.Mixed, default: {} },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// --- Sale Schema ---
export interface ISale extends Document {
  _id: any;
  saleId: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  customerAddress?: string;
  product: string;
  quantity: number;
  sellingPrice: number;
  subtotal: number;
  unitCommission: number;
  totalCommission: number;
  roundOff: number;
  finalAmount: number;
  paymentMethod: string;
  source: string;
  campaign: string;
  adSet?: string;
  ad?: string;
  salespersonId: string;
  salespersonName: string;
  status: "NEW" | "CONTACTED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED";
  remark?: string;
  isNcmOrder?: boolean;
  ncmOrderId?: string;
  ncmBranch?: string;
  ncmPickupBranch?: string;
  ncmDeliveryType?: string;
  ncmStatus?: string;
  ncmInstruction?: string;
  ncmWeight?: string;
  ncmResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    saleId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerMobile: { type: String, required: true },
    customerEmail: { type: String, default: "" },
    customerAddress: { type: String, default: "" },
    product: { type: String, default: "EazyBox" },
    quantity: { type: Number, required: true, default: 1 },
    sellingPrice: { type: Number, required: true, default: 9000 },
    subtotal: { type: Number, required: true },
    unitCommission: { type: Number, required: true },
    totalCommission: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: "eSewa / Khalti" },
    source: { type: String, default: "Meta Ads" },
    campaign: { type: String, default: "Default Campaign" },
    adSet: { type: String, default: "" },
    ad: { type: String, default: "" },
    salespersonId: { type: String, required: true },
    salespersonName: { type: String, required: true },
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"],
      default: "CONFIRMED",
    },
    remark: { type: String, default: "" },
    isNcmOrder: { type: Boolean, default: false },
    ncmOrderId: { type: String, default: "" },
    ncmBranch: { type: String, default: "" },
    ncmPickupBranch: { type: String, default: "TINKUNE" },
    ncmDeliveryType: { type: String, default: "Door2Door" },
    ncmStatus: { type: String, default: "" },
    ncmInstruction: { type: String, default: "" },
    ncmWeight: { type: String, default: "1" },
    ncmResponse: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// --- Customer Schema ---
export interface ICustomer extends Document {
  _id: any;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  salespersonId: string;
  salespersonName: string;
  totalOrders: number;
  totalUnits: number;
  totalSpent: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    salespersonId: { type: String, required: true },
    salespersonName: { type: String, required: true },
    totalOrders: { type: Number, default: 0 },
    totalUnits: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date },
  },
  { timestamps: true }
);

// --- Lead Schema ---
export interface ILeadNote {
  author: string;
  text: string;
  createdAt: Date;
}

export interface ILeadFollowUp {
  date: Date;
  note: string;
  status: "PENDING" | "COMPLETED";
}

export interface ILeadTimeline {
  title: string;
  description: string;
  user: string;
  timestamp: Date;
}

export interface ILead extends Document {
  _id: any;
  name: string;
  mobile: string;
  email?: string;
  source: string;
  campaign: string;
  adSet?: string;
  ad?: string;
  salespersonId: string;
  salespersonName: string;
  status: "NEW" | "CONTACTED" | "INTERESTED" | "FOLLOW-UP" | "CONFIRMED" | "CONVERTED" | "LOST";
  nextFollowUpDate?: Date;
  notes: ILeadNote[];
  followUps: ILeadFollowUp[];
  timeline: ILeadTimeline[];
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: "" },
    source: { type: String, default: "Meta Ads" },
    campaign: { type: String, default: "Default Campaign" },
    adSet: { type: String, default: "" },
    ad: { type: String, default: "" },
    salespersonId: { type: String, required: true },
    salespersonName: { type: String, required: true },
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "INTERESTED", "FOLLOW-UP", "CONFIRMED", "CONVERTED", "LOST"],
      default: "NEW",
    },
    nextFollowUpDate: { type: Date },
    notes: [
      {
        author: { type: String },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    followUps: [
      {
        date: { type: Date },
        note: { type: String },
        status: { type: String, enum: ["PENDING", "COMPLETED"], default: "PENDING" },
      },
    ],
    timeline: [
      {
        title: { type: String },
        description: { type: String },
        user: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// --- Campaign Schema ---
export interface ICampaign extends Document {
  _id: any;
  name: string;
  platform: string;
  budget: number;
  spend: number;
  leadsCount: number;
  confirmedCount: number;
  salesCount: number;
  revenue: number;
  conversionRate: number;
  roas: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  createdAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    platform: { type: String, default: "Meta Ads" },
    budget: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    leadsCount: { type: Number, default: 0 },
    confirmedCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    roas: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "PAUSED", "COMPLETED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

// --- Commission Payment Schema ---
export interface ICommissionPayment extends Document {
  _id: any;
  salespersonId: string;
  salespersonName: string;
  amount: number;
  paymentMethod: string;
  date: Date;
  reference?: string;
  remark?: string;
  createdAt: Date;
}

const CommissionPaymentSchema = new Schema<ICommissionPayment>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    salespersonId: { type: String, required: true },
    salespersonName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "Bank Transfer" },
    date: { type: Date, default: Date.now },
    reference: { type: String, default: "" },
    remark: { type: String, default: "" },
  },
  { timestamps: true }
);

// --- Audit Log Schema ---
export interface IAuditLog extends Document {
  _id: any;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  recordId?: string;
  details: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    recordId: { type: String, default: "" },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

// --- Notification Schema ---
export interface INotification extends Document {
  _id: any;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  recipientId?: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
    recipientId: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

// --- Product Schema ---
export interface IProduct extends Document {
  _id: any;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  unitCommission: number;
  stock: number;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, default: "Hardware" },
    costPrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    unitCommission: { type: Number, required: true, default: 500 },
    stock: { type: Number, default: 0 },
    description: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

// Clear model cache in development to ensure schema changes take effect immediately
if (process.env.NODE_ENV !== "production" && typeof window === "undefined" && mongoose && mongoose.models) {
  delete (mongoose.models as any).User;
  delete (mongoose.models as any).Sale;
  delete (mongoose.models as any).Customer;
  delete (mongoose.models as any).Lead;
  delete (mongoose.models as any).Campaign;
  delete (mongoose.models as any).CommissionPayment;
  delete (mongoose.models as any).AuditLog;
  delete (mongoose.models as any).Notification;
  delete (mongoose.models as any).Product;
}

const getModel = <T>(name: string, schema: Schema<T>): Model<T> => {
  if (typeof window !== "undefined" || !mongoose || !mongoose.models) {
    return {} as Model<T>;
  }
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
};

export const User: Model<IUser> = getModel("User", UserSchema);
export const Sale: Model<ISale> = getModel("Sale", SaleSchema);
export const Customer: Model<ICustomer> = getModel("Customer", CustomerSchema);
export const Lead: Model<ILead> = getModel("Lead", LeadSchema);
export const Campaign: Model<ICampaign> = getModel("Campaign", CampaignSchema);
export const CommissionPayment: Model<ICommissionPayment> = getModel("CommissionPayment", CommissionPaymentSchema);
export const AuditLog: Model<IAuditLog> = getModel("AuditLog", AuditLogSchema);
export const Notification: Model<INotification> = getModel("Notification", NotificationSchema);
export const Product: Model<IProduct> = getModel("Product", ProductSchema);
