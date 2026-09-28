import mongoose from "mongoose";
import {
  User,
  Sale,
  Customer,
  Lead,
  Campaign,
  CommissionPayment,
  AuditLog,
  Notification,
  Product,
} from "./models";
import {
  SEED_USERS,
  SEED_SALES,
  SEED_CUSTOMERS,
  SEED_LEADS,
  SEED_CAMPAIGNS,
  SEED_PAYMENTS,
  SEED_AUDIT_LOGS,
  SEED_PRODUCTS,
} from "./seed-data";

const MONGODB_URI = process.env.MONGODB_URI || "";

let isConnected = false;
let memoryStoreInitialized = false;

// In-Memory store fallback
export const memoryStore: {
  users: any[];
  sales: any[];
  customers: any[];
  leads: any[];
  campaigns: any[];
  payments: any[];
  auditLogs: any[];
  notifications: any[];
  products: any[];
} = {
  users: [...SEED_USERS],
  sales: [...SEED_SALES],
  customers: [...SEED_CUSTOMERS],
  leads: [...SEED_LEADS],
  campaigns: [...SEED_CAMPAIGNS],
  payments: [...SEED_PAYMENTS],
  auditLogs: [...SEED_AUDIT_LOGS],
  products: [...SEED_PRODUCTS],
  notifications: [],
};

export async function connectDB() {
  if ((mongoose.connection.readyState as number) === 1) {
    isConnected = true;
    return;
  }

  if (MONGODB_URI) {
    try {
      if ((mongoose.connection.readyState as number) === 0) {
        await mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 10000,
        });
      }
      if ((mongoose.connection.readyState as number) === 1) {
        isConnected = true;
        console.log("Connected to MongoDB Atlas");
        await seedAllMongoCollections();
        return;
      }
    } catch (error) {
      console.warn("MongoDB connection failed, falling back to Memory Store mode:", error);
      isConnected = false;
    }
  }

  // Memory fallback
  if (!memoryStoreInitialized) {
    memoryStoreInitialized = true;
  }
}

// Check if database is using real Mongoose or Memory Fallback
export function isMongoConnected() {
  return (mongoose.connection.readyState as number) === 1;
}

export async function seedAllMongoCollections(force = false) {
  if (!isMongoConnected()) return null;

  const counts: Record<string, number> = {};

  // Users
  const userCount = await User.countDocuments();
  if (userCount === 0 || force) {
    if (force && userCount > 0) await User.deleteMany({});
    await User.insertMany(SEED_USERS);
  }
  counts.users = await User.countDocuments();

  // Sales
  const saleCount = await Sale.countDocuments();
  if (saleCount === 0 || force) {
    if (force && saleCount > 0) await Sale.deleteMany({});
    await Sale.insertMany(SEED_SALES);
  }
  counts.sales = await Sale.countDocuments();

  // Customers
  const customerCount = await Customer.countDocuments();
  if (customerCount === 0 || force) {
    if (force && customerCount > 0) await Customer.deleteMany({});
    await Customer.insertMany(SEED_CUSTOMERS);
  }
  counts.customers = await Customer.countDocuments();

  // Leads
  const leadCount = await Lead.countDocuments();
  if (leadCount === 0 || force) {
    if (force && leadCount > 0) await Lead.deleteMany({});
    await Lead.insertMany(SEED_LEADS);
  }
  counts.leads = await Lead.countDocuments();

  // Campaigns
  const campaignCount = await Campaign.countDocuments();
  if (campaignCount === 0 || force) {
    if (force && campaignCount > 0) await Campaign.deleteMany({});
    await Campaign.insertMany(SEED_CAMPAIGNS);
  }
  counts.campaigns = await Campaign.countDocuments();

  // Payments
  const paymentCount = await CommissionPayment.countDocuments();
  if (paymentCount === 0 || force) {
    if (force && paymentCount > 0) await CommissionPayment.deleteMany({});
    await CommissionPayment.insertMany(SEED_PAYMENTS);
  }
  counts.payments = await CommissionPayment.countDocuments();

  // Audit Logs
  const logCount = await AuditLog.countDocuments();
  if (logCount === 0 || force) {
    if (force && logCount > 0) await AuditLog.deleteMany({});
    await AuditLog.insertMany(SEED_AUDIT_LOGS);
  }
  counts.auditLogs = await AuditLog.countDocuments();

  // Products
  const prodCount = await Product.countDocuments();
  if (prodCount === 0 || force) {
    if (force && prodCount > 0) await Product.deleteMany({});
    await Product.insertMany(SEED_PRODUCTS);
  }
  counts.products = await Product.countDocuments();

  // Notifications
  const notifCount = await Notification.countDocuments();
  if (notifCount === 0 || force) {
    if (force && notifCount > 0) await Notification.deleteMany({});
    await Notification.insertMany([
      {
        title: "New Lead Assigned",
        message: "Greenland Departmental Store assigned to Aayusha.",
        type: "info",
        isRead: false,
      },
      {
        title: "Sale Confirmed",
        message: "Sale #EZ-1004 confirmed for Apex Electronics Hub.",
        type: "success",
        isRead: true,
      },
    ]);
  }
  counts.notifications = await Notification.countDocuments();

  return counts;
}

// Database helper functions unifying Mongoose & Memory Store
export async function getUsers() {
  await connectDB();
  if (isMongoConnected()) {
    const users = await User.find().lean();
    if (users.length === 0) {
      await User.insertMany(SEED_USERS);
      return (await User.find().lean()).map((u: any) => ({ ...u, _id: String(u._id) }));
    }
    return users.map((u: any) => ({ ...u, _id: String(u._id) }));
  }
  return memoryStore.users;
}

export async function getProducts() {
  await connectDB();
  if (isMongoConnected()) {
    const prods = await Product.find().lean();
    if (prods.length === 0) {
      await Product.insertMany(SEED_PRODUCTS);
      return (await Product.find().lean()).map((p: any) => ({ ...p, _id: String(p._id) }));
    }
    return prods.map((p: any) => ({ ...p, _id: String(p._id) }));
  }
  return memoryStore.products;
}

export async function getSales() {
  await connectDB();
  if (isMongoConnected()) {
    const sales = await Sale.find().sort({ createdAt: -1 }).lean();
    if (sales.length === 0) {
      await Sale.insertMany(SEED_SALES);
      return (await Sale.find().sort({ createdAt: -1 }).lean()).map((s: any) => ({ ...s, _id: String(s._id) }));
    }
    return sales.map((s: any) => ({ ...s, _id: String(s._id) }));
  }
  return memoryStore.sales.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCustomers() {
  await connectDB();
  if (isMongoConnected()) {
    const custs = await Customer.find().sort({ createdAt: -1 }).lean();
    if (custs.length === 0) {
      await Customer.insertMany(SEED_CUSTOMERS);
      return (await Customer.find().sort({ createdAt: -1 }).lean()).map((c: any) => ({ ...c, _id: String(c._id) }));
    }
    return custs.map((c: any) => ({ ...c, _id: String(c._id) }));
  }
  return memoryStore.customers;
}

export async function getLeads() {
  await connectDB();
  if (isMongoConnected()) {
    const leads = await Lead.find().sort({ createdAt: -1 }).lean();
    if (leads.length === 0) {
      await Lead.insertMany(SEED_LEADS);
      return (await Lead.find().sort({ createdAt: -1 }).lean()).map((l: any) => ({ ...l, _id: String(l._id) }));
    }
    return leads.map((l: any) => ({ ...l, _id: String(l._id) }));
  }
  return memoryStore.leads;
}

export async function getCampaigns() {
  await connectDB();
  if (isMongoConnected()) {
    const camps = await Campaign.find().lean();
    if (camps.length === 0) {
      await Campaign.insertMany(SEED_CAMPAIGNS);
      return (await Campaign.find().lean()).map((c: any) => ({ ...c, _id: String(c._id) }));
    }
    return camps.map((c: any) => ({ ...c, _id: String(c._id) }));
  }
  return memoryStore.campaigns;
}

export async function getPayments() {
  await connectDB();
  if (isMongoConnected()) {
    const pays = await CommissionPayment.find().sort({ createdAt: -1 }).lean();
    if (pays.length === 0) {
      await CommissionPayment.insertMany(SEED_PAYMENTS);
      return (await CommissionPayment.find().sort({ createdAt: -1 }).lean()).map((p: any) => ({ ...p, _id: String(p._id) }));
    }
    return pays.map((p: any) => ({ ...p, _id: String(p._id) }));
  }
  return memoryStore.payments;
}

export async function getAuditLogs() {
  await connectDB();
  if (isMongoConnected()) {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).lean();
    if (logs.length === 0) {
      await AuditLog.insertMany(SEED_AUDIT_LOGS);
      return (await AuditLog.find().sort({ createdAt: -1 }).lean()).map((l: any) => ({ ...l, _id: String(l._id) }));
    }
    return logs.map((l: any) => ({ ...l, _id: String(l._id) }));
  }
  return memoryStore.auditLogs;
}
