import express from "express";
import { formValidation } from "../../middlewares/formValidation.js";
import { loginSchema, signupSchema } from "../../validations/validation.js";
import userController from "./controller.js";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", formValidation(signupSchema), userController.signup);
router.post("/verifyOtp", userController.verifyOtp);
router.post("/login", formValidation(loginSchema), userController.login);
router.get("/resendOtp/:token", userController.resendOtp);
router.get("/refresh", userController.refresh);
router.post("/google-login", userController.loginGoogle);
router.post('/checkUsernameAvailability', userController.checkUsername)
router.post("/addUsername", checkAccessToken, userController.addUsername)
export default router;
