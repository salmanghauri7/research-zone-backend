import { decodeJWT } from "../utils/generateJWT.js";

/**
 * Socket.IO authentication middleware
 * Verifies the JWT token sent via socket.auth.token
 * @param {import('socket.io').Socket} socket - The socket instance
 * @param {Function} next - The next middleware function
 */
export const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }

    // Verify and decode the JWT token
    const user = decodeJWT(token);

    // Attach user data to socket for use in event handlers
    socket.user = user;

    console.log(`🔐 Socket authenticated for user: ${user.email || user._id}`);

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new Error("Authentication error: Token expired"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new Error("Authentication error: Invalid token"));
    }
    return next(new Error("Authentication error: " + err.message));
  }
};
