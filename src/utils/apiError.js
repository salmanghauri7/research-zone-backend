import ApiResponse from "./apiResponse.js";

export class ApiError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode; // e.g., "TOKEN_EXPIRED", "INVALID_TOKEN"
    // Ensure proper stack trace (for debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}

export function globalError(err, req, res, next) {
  // default values
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errorCode = err.errorCode || null;

  // Only log full stack trace for unexpected errors (5xx)
  if (statusCode >= 500) {
    console.error("🔥 Error caught by global handler:", err);
  } else {
    console.warn(
      `⚠️ ${statusCode} - ${message}${errorCode ? ` [${errorCode}]` : ""}`
    );
  }

  return ApiResponse.error(res, message, statusCode, { errorCode });
}
