import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "noreply2082@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || "ozjjxfgkqdzeqbhj";
const SMTP_FROM = process.env.SMTP_FROM || `"EazyCrm" <${SMTP_USER}>`;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendWelcomeEmail(to: string, name: string, role: string, temporaryPassword?: string) {
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject: "Welcome to EazyCrm - Account Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; borderRadius: 8px;">
          <h2 style="color: #4f46e5;">Welcome to EazyCrm, ${name}!</h2>
          <p>Your team member account has been created successfully.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Role:</strong> ${role}</p>
            <p style="margin: 4px 0;"><strong>Username / Email:</strong> ${to}</p>
            ${temporaryPassword ? `<p style="margin: 4px 0;"><strong>Password:</strong> ${temporaryPassword}</p>` : ""}
          </div>
          <p>You can now log in at your EazyCrm portal.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This is an automated notification from EazyCrm.</p>
        </div>
      `,
    });
    console.log("Welcome email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.warn("Failed to send welcome email:", error.message);
    return { success: false, error: error.message };
  }
}

export async function sendSaleNotificationEmail(to: string, saleDetails: any) {
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject: `New Sale Confirmation #${saleDetails.saleId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; borderRadius: 8px;">
          <h2 style="color: #10b981;">New Sale Confirmed!</h2>
          <p>Sale #${saleDetails.saleId} has been successfully recorded in EazyCrm.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Customer:</strong> ${saleDetails.customerName} (${saleDetails.customerMobile})</p>
            <p style="margin: 4px 0;"><strong>Product:</strong> ${saleDetails.product} (Qty: ${saleDetails.quantity})</p>
            <p style="margin: 4px 0;"><strong>Total Amount:</strong> Rs. ${saleDetails.finalAmount}</p>
            <p style="margin: 4px 0;"><strong>Sales Representative:</strong> ${saleDetails.salespersonName}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">EazyCrm Sales Notification</p>
        </div>
      `,
    });
    console.log("Sale notification email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.warn("Failed to send sale notification email:", error.message);
    return { success: false, error: error.message };
  }
}
