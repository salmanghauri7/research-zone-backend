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
  io = new Server(httpServer, {
    cors: {
      origin: config.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
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
