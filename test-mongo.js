const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

let uri = "";
try {
  const envContent = fs.readFileSync(path.join(__dirname, ".env.local"), "utf8");
  const match = envContent.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
  if (match) uri = match[1];
} catch (e) {}

if (!uri) {
  uri = "mongodb://shresthafinance2082_db_user:Eazycrm123@ac-2zhphvf-shard-00-00.qerefzi.mongodb.net:27017,ac-2zhphvf-shard-00-01.qerefzi.mongodb.net:27017,ac-2zhphvf-shard-00-02.qerefzi.mongodb.net:27017/EazyCrm?ssl=true&replicaSet=atlas-96n7fs-shard-0&authSource=admin&appName=EazyCrm";
}

console.log("Connecting to URI:", uri.replace(/Eazycrm123/, "*****"));

async function run() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("SUCCESS: Connected to MongoDB Atlas!");
    
    // Define schemas to force collection creation
    const UserSchema = new mongoose.Schema({ name: String, email: String, role: String }, { timestamps: true });
    const SaleSchema = new mongoose.Schema({ saleId: String, customerName: String, finalAmount: Number }, { timestamps: true });
    const CustomerSchema = new mongoose.Schema({ name: String, mobile: String }, { timestamps: true });
    const LeadSchema = new mongoose.Schema({ name: String, mobile: String, status: String }, { timestamps: true });
    const CampaignSchema = new mongoose.Schema({ name: String, platform: String }, { timestamps: true });
    const PaymentSchema = new mongoose.Schema({ salespersonName: String, amount: Number }, { timestamps: true });
    const LogSchema = new mongoose.Schema({ action: String, details: String }, { timestamps: true });
    const NotifSchema = new mongoose.Schema({ title: String, message: String }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model("User", UserSchema);
    const Sale = mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
    const Customer = mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
    const Lead = mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
    const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);
    const Payment = mongoose.models.CommissionPayment || mongoose.model("CommissionPayment", PaymentSchema);
    const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", LogSchema);
    const Notification = mongoose.models.Notification || mongoose.model("Notification", NotifSchema);

    // Create 1 document in each to ensure collections are physically created in MongoDB Atlas!
    if ((await User.countDocuments()) === 0) await User.create({ name: "Admin User", email: "admin@eazybox.com", role: "ADMIN" });
    if ((await Sale.countDocuments()) === 0) await Sale.create({ saleId: "EZ-1001", customerName: "Nepal Trading", finalAmount: 9000 });
    if ((await Customer.countDocuments()) === 0) await Customer.create({ name: "Nepal Trading", mobile: "9800000000" });
    if ((await Lead.countDocuments()) === 0) await Lead.create({ name: "Shrestha Enterprise", mobile: "9841000000", status: "NEW" });
    if ((await Campaign.countDocuments()) === 0) await Campaign.create({ name: "Meta Dashain Promo", platform: "Meta Ads" });
    if ((await Payment.countDocuments()) === 0) await Payment.create({ salespersonName: "Prabin Sharma", amount: 5000 });
    if ((await AuditLog.countDocuments()) === 0) await AuditLog.create({ action: "INIT_DB", details: "Initial MongoDB Setup" });
    if ((await Notification.countDocuments()) === 0) await Notification.create({ title: "Welcome", message: "System initialized" });

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("SUCCESS! Created Collections in MongoDB database:", collections.map(c => c.name));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("FAILED TO CONNECT TO MONGODB:", err.message);
    process.exit(1);
  }
}

run();
