import nodemailer from "nodemailer";
import { errorMessages } from "../constants/messages.js";
import { ApiError } from "./apiError.js";
import { config } from "../constants/config.js";

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
