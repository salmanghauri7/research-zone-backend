import jwt from "jsonwebtoken";
import { config } from "../constants/config.js";

export function generateJWT(payload, options) {
  return jwt.sign(payload, config.JWT_SECRET, options);
}

export function decodeJWT(token) {
  return jwt.verify(token, config.JWT_SECRET);
}
