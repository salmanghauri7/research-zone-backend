import express from "express";
import { config, configInit } from "./constants/config.js";
import routes from "./routes/index.js";
import connectDb from "./config/dbConfig.js";
import { globalError } from "./utils/apiError.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// middlewares
app.use(express.json());

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(
    `📨 ${req.method} ${req.path} - Origin: ${
      req.headers.origin || "No Origin"
    }`
  );
  next();
});

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());

routes(app);

// to handle global errors
app.use(globalError);

const PORT = config.PORT || 5000;

const startServer = async () => {
  try {
    // load the config.js for development or production

    await configInit();

    // Log critical config values (don't log secrets)
    console.log("\n🔧 Configuration Check:");
    console.log(`   NODE_ENV: ${config.NODE_ENV}`);
    console.log(`   PORT: ${config.PORT}`);
    console.log(
      `   GOOGLE_CLIENT_ID: ${
        config.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing"
      }`
    );
    console.log(
      `   GOOGLE_CLIENT_SECRET: ${
        config.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing"
      }`
    );
    console.log(
      `   JWT_SECRET: ${config.JWT_SECRET ? "✅ Set" : "❌ Missing"}`
    );
    console.log(
      `   MONGO_URI: ${config.MONGO_URI ? "✅ Set" : "❌ Missing"}\n`
    );

    console.log(
      `SMTP_PASS: ${config.SMTP_PASS ? `${config.SMTP_PASS} ` : "❌ Missing"}`
    );

    await connectDb();

    // 3. Start the server ONLY AFTER the DB is connected
    app.listen(PORT, () => {
      console.log(`✅ Server is connected http://localhost:${PORT}`);
    });
  } catch (error) {
    // 4. If the database connection fails, log it and exit
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Exit the process with a failure code
  }
};

startServer();
