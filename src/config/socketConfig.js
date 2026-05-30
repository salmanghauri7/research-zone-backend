import { Server } from "socket.io";
import { config } from "../constants/config.js";
import { socketAuthMiddleware } from "../middlewares/socketAuthMiddleware.js";

let io;

/**
 * Initialize Socket.IO with the HTTP server
 * @param {import('http').Server} httpServer - The HTTP server instance
 * @returns {Server} - The Socket.IO server instance
 */
export const initializeSocket = (httpServer) => {
  const socketOrigin = (config.FRONTEND_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  io = new Server(httpServer, {
    cors: {
      origin: socketOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  return io;
};

/**
 * Get the Socket.IO instance
 * @returns {Server} - The Socket.IO server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized! Call initializeSocket first.");
  }
  return io;
};
