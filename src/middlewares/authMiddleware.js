import { decodeJWT } from "../utils/generateJWT.js";
import { ApiError } from "../utils/apiError.js";
import { errorMessages } from "../constants/messages.js";

export async function checkAccessToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, errorMessages.USER.AUTH_NOT_PROVIDED);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(401, errorMessages.USER.AUTH_NOT_PROVIDED);
    }
    const user = decodeJWT(token);
    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(401, errorMessages.USER.INVALID_CREDENTIALS));
  }
}
