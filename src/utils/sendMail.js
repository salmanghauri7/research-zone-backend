import nodemailer from "nodemailer";
import { errorMessages } from "../constants/messages.js";
import { ApiError } from "./apiError.js";
import { config } from "../constants/config.js";

// Validate SMTP credentials before creating transporter
if (!config.SMTP_USER || !config.SMTP_PASS) {
  console.error("❌ SMTP Configuration Error:");
  console.error(`   SMTP_USER: ${config.SMTP_USER ? "✅ Set" : "❌ Missing"}`);
  console.error(`   SMTP_PASS: ${config.SMTP_PASS ? "✅ Set" : "❌ Missing"}`);
  console.error("   Make sure these are set in .env (dev) or AWS Parameter Store (prod)");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

export async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: config.SMTP_USER,
      to,
      subject,
      html,
    };
    // console.log("📧 Sending email to:", to);
    const info = await transporter.sendMail(mailOptions);
    // console.log("✅ Email sent successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new ApiError(errorMessages.USER.EMAIL_FAILED, 500);
  }
}
