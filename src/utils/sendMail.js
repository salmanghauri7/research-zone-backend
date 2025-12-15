import nodemailer from "nodemailer";
import { errorMessages } from "../constants/messages.js";
import { ApiError } from "./apiError.js";
import { config } from "../constants/config.js";

// Lazy initialization - transporter will be created on first use
let transporter = null;

function getTransporter() {
  if (!transporter) {
    // Validate SMTP credentials
    if (!config.SMTP_USER || !config.SMTP_PASS) {
      console.error("❌ SMTP Configuration Error:");
      console.error(`   SMTP_USER: ${config.SMTP_USER ? "✅ Set" : "❌ Missing"}`);
      console.error(`   SMTP_PASS: ${config.SMTP_PASS ? "✅ Set" : "❌ Missing"}`);
      throw new ApiError("SMTP credentials not configured", 500);
    }

    console.log("🔧 Creating SMTP transporter...");
    console.log(`   User: ${config.SMTP_USER}`);
    console.log(`   Pass: ${config.SMTP_PASS ? "***" + config.SMTP_PASS.slice(-4) : "Missing"}`);

    transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: config.SMTP_USER,
      to,
      subject,
      html,
    };
    // console.log("📧 Sending email to:", to);
    const info = await getTransporter().sendMail(mailOptions);
    // console.log("✅ Email sent successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new ApiError(errorMessages.USER.EMAIL_FAILED, 500);
  }
}
