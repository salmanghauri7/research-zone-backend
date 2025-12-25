import { decodeJWT } from "../utils/generateJWT.js";
import { ApiError } from "../utils/apiError.js";
import { errorMessages } from "../constants/messages.js";

export async function checkAccessToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(errorMessages.USER.AUTH_NOT_PROVIDED, 401);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(errorMessages.USER.AUTH_NOT_PROVIDED, 401);
    }
    const user = decodeJWT(token);
    req.user = user;
    next();
  } catch (err) {
    // Handle token expiration or invalid token
    if (err.name === "TokenExpiredError") {
      return next(
        new ApiError(
          errorMessages.USER.TOKEN_EXPIRED || "Access token has expired",
          401,
          "TOKEN_EXPIRED"
        )
      );
    }
    if (err.name === "JsonWebTokenError") {
      return next(
        new ApiError(
          errorMessages.USER.INVALID_CREDENTIALS,
          401,
          "INVALID_TOKEN"
        )
      );
    }
    // Re-throw if it's already an ApiError
    if (err instanceof ApiError) {
      return next(err);
    }
    next(
      new ApiError(errorMessages.USER.INVALID_CREDENTIALS, 401, "INVALID_TOKEN")
    );
  }
}
