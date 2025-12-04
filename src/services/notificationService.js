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
 * Generate unique transaction ID
 */
const generateTransactionId = () => {
  return "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase();
};

/**
 * Format date in Indian locale
 */
const formatDate = () => {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Send transaction notification email
 *
 * Vercel-Style Modern Email Template
 * - System fonts (SF Pro, Segoe UI, Roboto)
 * - Monochromatic base with semantic accents
 * - 465px container, 1px borders (#eaeaea)
 * - Minimalist spacing
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
  const transactionId = generateTransactionId();
  const formattedDate = formatDate();

  const subject = isCredit
    ? `Funds Received - ₹${amount.toFixed(2)}`
    : `Payment Sent - ₹${amount.toFixed(2)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
  
  <!-- Wrapper -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Container -->
        <table width="465" border="0" cellspacing="0" cellpadding="0" style="max-width: 465px; width: 100%; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 20px; border-bottom: 1px solid #eaeaea;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 32px; height: 32px; background-color: #000000; border-radius: 8px; text-align: center; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 14px; font-weight: bold;">H</span>
                        </td>
                        <td style="padding-left: 10px;">
                          <span style="font-size: 14px; font-weight: 600; color: #000000; letter-spacing: -0.5px;">CDAC Hostel</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; color: #666666; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${transactionId}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              
              <!-- Icon Badge -->
              <table border="0" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td style="width: 48px; height: 48px; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 50%; text-align: center; vertical-align: middle; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <span style="font-size: 20px; color: ${
                      isCredit ? "#16a34a" : "#666666"
                    };">${isCredit ? "↙" : "↗"}</span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin: 24px 0 8px 0; font-size: 24px; font-weight: 600; color: #000000; letter-spacing: -0.5px;">
                ${isCredit ? "Funds Received" : "Payment Sent"}
              </h1>
              <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 24px; color: #666666;">
                ${
                  isCredit
                    ? `Your account has been credited with ₹${amount.toFixed(
                        2
                      )}.`
                    : `You sent a payment of ₹${amount.toFixed(2)}.`
                }
              </p>

              <!-- Transaction Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 8px; text-align: left;">
                
                <!-- Row 1: Amount -->
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #eaeaea;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; font-weight: 500; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Amount</td>
                        <td align="right" style="font-size: 16px; font-weight: 500; color: ${
                          isCredit ? "#16a34a" : "#000000"
                        }; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
                          ${isCredit ? "+" : "-"}₹${amount.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Row 2: Date -->
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #eaeaea;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; font-weight: 500; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Date</td>
                        <td align="right" style="font-size: 14px; color: #000000;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Row 3: Description -->
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; font-weight: 500; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding-top: 2px;">Note</td>
                        <td align="right" style="font-size: 14px; color: #000000;">${description}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <!-- Balance Section -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #eaeaea;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; font-weight: 500; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">
                          💳 Current Balance
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 32px; font-weight: 700; color: #000000; letter-spacing: -1px;">
                          ₹${balance.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
                      View Transaction History
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #eaeaea; padding: 20px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 20px; color: #666666;">
                Questions? Contact <a href="mailto:support@hostel.edu" style="color: #2563eb; text-decoration: underline;">Hostel Support</a>.
              </p>
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Hostel Management System • Automated Notification
              </p>
            </td>
          </tr>

        </table>
        <!-- End Email Container -->

      </td>
    </tr>
  </table>
  <!-- End Wrapper -->

</body>
</html>
  `;

  const text = `
${isCredit ? "Money Added to Your Account" : "Money Deducted from Your Account"}
${"=".repeat(40)}

Hi ${studentName},

${
  isCredit
    ? `Your account has been credited with ₹${amount.toFixed(2)}.`
    : `You sent a payment of ₹${amount.toFixed(2)}.`
}

TRANSACTION DETAILS
-------------------
Transaction ID: ${transactionId}
Amount: ${isCredit ? "+" : "-"}₹${amount.toFixed(2)}
Date: ${formattedDate}
Note: ${description}

CURRENT BALANCE: ₹${balance.toFixed(2)}

---
Questions? Contact Hostel Support.
Hostel Management System • Automated Notification
  `;

  return sendEmail({
    to: studentEmail,
    subject,
    text,
    html,
  });
};
