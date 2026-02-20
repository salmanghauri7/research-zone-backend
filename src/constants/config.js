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
  FRONTEND_URL: process.env.FRONTEND_URL,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME
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
  let nextToken; // Store the pagination token
  let loadedCount = 0;

  try {
    // Loop until there are no more pages
    do {
      const command = new GetParametersByPathCommand({
        Path: "/research-zone-backend/prod/",
        WithDecryption: true,
        Recursive: true,
        NextToken: nextToken, // Pass the token from the previous loop (undefined on first run)
        MaxResults: 10 // Explicitly stating the max (optional, but good for clarity)
      });

      const response = await client.send(command);

      if (response.Parameters && response.Parameters.length > 0) {
        response.Parameters.forEach((param) => {
          const name = param.Name.split("/").pop();

          if (name in config) {
            config[name] = param.Value;
            console.log(`   ✅ Loaded: ${name}`);
            loadedCount++;
          } else {
            console.log(`   ⚠️ Skipped: ${name} (not in config)`);
          }
        });
      }

      // Update nextToken for the next iteration
      nextToken = response.NextToken;

    } while (nextToken); // Continue only if a NextToken exists

    console.log(
      `\n✅ AWS Secrets loaded successfully (${loadedCount} parameters)`
    );

    // Debug: Check if critical SMTP values are loaded
    console.log("\n🔍 SMTP Configuration Check:");
    console.log(
      `   SMTP_USER: ${
        config.SMTP_USER ? `✅ Set ${config.SMTP_USER} ` : "❌ Missing"
      }`
    );
    console.log(
      `   SMTP_PASS: ${
        config.SMTP_PASS ? `✅ Set (Hidden) ` : "❌ Missing"
      }`
    );
  } catch (error) {
    console.error("❌ Failed to load secrets from AWS:", error);
    process.exit(1);
  }
};
