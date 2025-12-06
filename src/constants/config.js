import { GetParametersByPathCommand, SSMClient } from "@aws-sdk/client-ssm";
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
  NODE_ENV: process.env.NODE_ENV,
};

export const constants = {
  VERIFICATION_EMAIL_SUBJECT: "Verify your email",
};

export const configInit = async () => {
  if (config.NODE_ENV === "development") {
    console.log("🛠️ Running in Development Mode (Using local .env)");
    return;
  }

  console.log(
    "☁️ Running in Production Mode (Fetching from AWS Parameter Store...)"
  );
  const client = new SSMClient({ region: "ap-south-1" });
  const command = new GetParametersByPathCommand({
    Path: "/research-zone-backend/prod/", // Your Prefix
    WithDecryption: true,
    Recursive: true,
  });

  try {
    const response = await client.send(command);

    if (!response.Parameters || response.Parameters.length === 0) {
      console.warn("⚠️ No parameters found in AWS at this path!");
      return;
    }

    response.Parameters.forEach((param) => {
      const name = param.Name.split("/").pop();

      if (name in config) {
        config[name] = param.Value;
      }

      console.log("✅ AWS Secrets loaded successfully.");
    });
  } catch (error) {
    console.error("❌ Failed to load secrets from AWS:", error);
    process.exit(1); // Crash hard if secrets fail
  }
};
