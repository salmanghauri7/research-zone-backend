import dotenv from "dotenv";
dotenv.config();

export const config = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
  ETHEREAL_USERNAME: process.env.ETHEREAL_USERNAME,
  ETHEREAL_PASSWORD: process.env.ETHEREAL_PASSWORD,
  APP_EMAIL: process.env.APP_EMAIL,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

export const constants = {
  VERIFICATION_EMAIL_SUBJECT: "Verify your email",
};
