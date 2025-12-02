import ApiResponse from "./apiResponse.js";

export class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // Ensure proper stack trace (for debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}

export function globalError(err, req, res, next) {
  console.error("🔥 Error caught by global handler:", err);

  // default values
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return ApiResponse.error(res, message, statusCode);
}
