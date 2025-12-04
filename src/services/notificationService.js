import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * Email Service using Nodemailer
 * Uses SMTP credentials from environment variables
 *
 * Required env vars (example with Gmail):
 * - EMAIL_HOST       (e.g. "smtp.gmail.com")
 * - EMAIL_PORT       (e.g. 587)
 * - EMAIL_USER       (your email address)
 * - EMAIL_PASSWORD   (app password / SMTP password)
 * - EMAIL_FROM       (displayed sender, defaults to EMAIL_USER)
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    // Helpful log for debugging
    console.log("\n" + "=".repeat(80));
    console.log("Email sent via Nodemailer");
    console.log("Message ID:", info.messageId);
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("=".repeat(80) + "\n");

    return true;
  } catch (error) {
    console.error("Failed to send email via Nodemailer:", error);
    // Don't throw here so other flows can decide how to handle failures
    return false;
  }
};

export const sendInAppNotification = async ({ userId, message }) => {
  console.log(`📱 In-app notification to ${userId}: ${message}`);
  return true;
};

/**
 * Send transaction notification email
 */
export const sendTransactionEmail = async ({
  studentEmail,
  studentName,
  transactionType,
  amount,
  description,
  balance,
}) => {
  const isCredit = transactionType === "CREDIT";
  const subject = isCredit
    ? `💰 Money Added to Your Account - ₹${amount}`
    : `💳 Payment Successful - ₹${amount}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${
          isCredit ? "#4CAF50" : "#2196F3"
        }; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .transaction-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid ${
          isCredit ? "#4CAF50" : "#2196F3"
        }; }
        .amount { font-size: 32px; font-weight: bold; color: ${
          isCredit ? "#4CAF50" : "#2196F3"
        }; margin: 10px 0; }
        .balance { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #ffc107; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .label { color: #666; font-size: 14px; margin-bottom: 5px; }
        .value { font-size: 16px; font-weight: 500; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isCredit ? "💰 Money Added" : "💳 Payment Processed"}</h1>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          <p>${
            isCredit
              ? "Money has been successfully added to your hostel account."
              : "Your payment has been successfully processed."
          }</p>
          
          <div class="transaction-details">
            <div class="label">Transaction Type</div>
            <div class="value">${
              isCredit ? "✅ Credit (Money Added)" : "❌ Debit (Money Deducted)"
            }</div>
            
            <div class="label">Amount</div>
            <div class="amount">${isCredit ? "+" : "-"} ₹${amount.toFixed(
    2
  )}</div>
            
            <div class="label">Description</div>
            <div class="value">${description}</div>
            
            <div class="label">Date & Time</div>
            <div class="value">${new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}</div>
          </div>

          <div class="balance">
            <div class="label">Current Balance</div>
            <div style="font-size: 24px; font-weight: bold; color: #f57c00;">₹${balance.toFixed(
              2
            )}</div>
          </div>

          <p style="margin-top: 30px;">If you have any questions or concerns about this transaction, please contact the hostel administration.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from the Hostel Management System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Dear ${studentName},

${
  isCredit
    ? "Money has been successfully added to your hostel account."
    : "Your payment has been successfully processed."
}

Transaction Details:
- Type: ${transactionType}
- Amount: ${isCredit ? "+" : "-"} ₹${amount.toFixed(2)}
- Description: ${description}
- Date: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

Current Balance: ₹${balance.toFixed(2)}

If you have any questions, please contact the hostel administration.

---
This is an automated email from the Hostel Management System.
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    text,
    html,
  });
};
