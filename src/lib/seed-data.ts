export const SEED_USERS = [
  {
    _id: "user_admin_01",
    name: "Admin User",
    email: "admin@eazybox.com",
    mobile: "9800000001",
    password: "Password@123",
    role: "ADMIN",
    department: "Executive Management",
    status: "ACTIVE",
    avatarUrl: "",
    commissionRate: 5,
    lastActive: new Date(),
  },
  {
    _id: "user_aayusha_02",
    name: "Aayusha Paudel",
    email: "aayusha@eazybox.com",
    mobile: "9841234567",
    password: "Password@123",
    role: "SALES_EXECUTIVE",
    department: "Direct Sales",
    status: "ACTIVE",
    avatarUrl: "",
    commissionRate: 5,
    lastActive: new Date(),
  },
];

export const SEED_CAMPAIGNS: any[] = [];
export const SEED_PRODUCTS = [
  {
    _id: "prod_01",
    name: "EazyBox POS Hardware Suite",
    sku: "EZ-POS-HW-01",
    category: "Hardware",
    costPrice: 5500,
    sellingPrice: 9000,
    unitCommission: 700,
    stock: 50,
    description: "Complete All-In-One POS Hardware Suite including Touch Terminal & Printer",
    status: "ACTIVE",
  },
];

export const SEED_SALES: any[] = [];
export const SEED_CUSTOMERS: any[] = [];
export const SEED_LEADS: any[] = [];
export const SEED_PAYMENTS: any[] = [];
export const SEED_AUDIT_LOGS: any[] = [];
