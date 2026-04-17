import express from "express";
import { formValidation } from "../../middlewares/formValidation.js";
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  googleLoginSchema,
  checkUsernameAvailabilitySchema,
  addUsernameSchema,
} from "./validation.js";
import userController from "./controller.js";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Authentication routes
router.post("/signup", formValidation(signupSchema), userController.signup);
router.post(
  "/verifyOtp",
  formValidation(verifyOtpSchema),
  userController.verifyOtp,
);
router.post("/login", formValidation(loginSchema), userController.login);
router.get("/refresh", userController.refresh);

// OAuth routes
router.post(
  "/google-login",
  formValidation(googleLoginSchema),
  userController.loginGoogle,
);

// OTP routes
router.get(
  "/resendOtp/:token",
  formValidation(resendOtpSchema),
  userController.resendOtp,
);

// Username routes
router.post(
  "/checkUsernameAvailability",
  formValidation(checkUsernameAvailabilitySchema),
  userController.checkUsername,
);
router.post(
  "/addUsername",
  checkAccessToken,
  formValidation(addUsernameSchema),
  userController.addUsername,
);

export default router;
