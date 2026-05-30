import express from "express";
import { createServer } from "http";
import { config } from "./constants/config.js";
import routes from "./routes/index.js";
import connectDb from "./config/dbConfig.js";
import { globalError } from "./utils/apiError.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initializeSocket } from "./config/socketConfig.js";
import { registerChatHandlers } from "./modules/chat/socketHandler.js";
import "./modules/paper-chat/model.js"; // Initialize ChunkEmbedding collection

const app = express();
const httpServer = createServer(app);

// middlewares
app.use(express.json({ limit: "10mb" })); // to parse JSON bodies with a larger limit
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(
    `📨 ${req.method} ${req.path} - Origin: ${
      req.headers.origin || "No Origin"
    }`,
  );
  next();
});

app.use(
  cors({
    origin: config.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(cookieParser());

routes(app);

// to handle global errors
app.use(globalError);

const PORT = config.PORT || 5000;

const startServer = async () => {
  try {
    await connectDb();

    // Initialize Socket.IO AFTER config is loaded
    const io = initializeSocket(httpServer);
    registerChatHandlers(io);

    // 3. Start the server ONLY AFTER the DB is connected
    httpServer.listen(PORT, () => {
      console.log(`✅ Server is connected http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO is ready for connections`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
