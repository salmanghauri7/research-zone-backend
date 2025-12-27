import { errorMessages, successMessages } from "../../constants/messages.js";
import apiResponse from "../../utils/apiResponse.js";
import { generateJWT } from "../../utils/generateJWT.js";
import { OAuth2Client } from "google-auth-library";

import User from "./model.js";
import Workspace from "../workspaces/model.js";
import userservices from "./services.js";
import { config } from "../../constants/config.js";
import { ApiError } from "../../utils/apiError.js";

const userDb = new userservices(User);
const workspaceDb = new userservices(Workspace);
const client = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000"
);

export default class userController {
  static async signup(req, res) {
    try {
      const userData = req.body;

      // 2. Business Logic Delegation: Pass everything to the service layer
      const user = await userDb.signupUser(userData);

      const token = generateJWT(
        { email: user.email, firstName: user.firstName },
        { expiresIn: "20m" }
      );

      return apiResponse.success(
        res,
        successMessages.USER.SIGNUP_SUCCESS,
        200,
        {
          token: token,
        }
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.USER.SIGNUP_ERROR,
        err.statusCode || 500
      );
    }
  }
  static async verifyOtp(req, res) {
    try {
      const { otp } = req.body;

      const { user, refreshToken } = await userDb.verifyOtp(otp);
      const accessToken = await userDb.generateAccessToken(user);

      await userDb.sendCookie(res, refreshToken, 7 * 24 * 60 * 60 * 1000);

      // Create personal workspace for the user
      const personalWorkspace = await workspaceDb.create({
        title: "personal workspace",
        owner: user._id,
        isPersonalWorkspace: true,
      });

      return apiResponse.success(res, successMessages.USER.OTP_VERIFIED, 200, {
        accessToken: accessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          username: user.username,
          email: user.email,
        },
        workspace: {
          id: personalWorkspace._id,
          title: personalWorkspace.title,
        },
      });
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.USER.OTP_VERIFICATION_FAILED,
        err.statusCode || 500
      );
    }
  }
  static async resendOtp(req, res) {
    try {
      const token = req.params.token;
      await userDb.resendOtp(token);
      return apiResponse.success(
        res,
        successMessages.USER.OTP_RESENT_SUCCESS,
        200
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.USER.OTP_RESEND_FAILED,
        err.statusCode || 500
      );
    }
  }

  static async login(req, res) {
    try {
      const { email, username, password } = req.body;

      // Verify credentials first and get user
      const user = await userDb.verifyCredentials(email, username, password);

      const workspace = await workspaceDb.findOne({
        owner: user._id,
        isPersonalWorkspace: true,
      });

      // Generate both tokens
      const [refreshToken, accessToken] = await Promise.all([
        userDb.updateRefreshToken(user),
        userDb.generateAccessToken(user),
      ]);

      // Set the cookie
      await userDb.sendCookie(res, refreshToken, 7 * 24 * 60 * 60 * 1000);

      return apiResponse.success(res, successMessages.USER.LOGIN_SUCCESS, 200, {
        accessToken: accessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          username: user.username,
          email: user.email,
        },
        workspace: {
          id: workspace._id,
          title: workspace.title,
        },
      });
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.USER.LOGIN_FAILED,
        err.statusCode || 500
      );
    }
  }

  static async refresh(req, res) {
    try {
      const refreshToken = req.cookies.authCookie;
      const user = await userDb.getUserFromToken(refreshToken);

      const accessToken = await userDb.generateAccessToken(user);

      return apiResponse.success(
        res,
        successMessages.USER.ACCESS_TOKEN_SUCCESS,
        200,
        {
          accessToken,
        }
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.USER.REFRESH_FAILED,
        err.statusCode || 500
      );
    }
  }

  static async loginGoogle(req, res) {
    try {
      console.log("🔐 Google Login Request Received");
      const { code } = req.body;

      if (!code) {
        console.error("❌ No authorization code provided");
        throw new ApiError(errorMessages.USER.AUTH_NOT_PROVIDED, 400);
      }

      console.log("🔄 Exchanging code for tokens...");
      const { tokens } = await client.getToken(code);
      console.log("✅ Tokens received from Google");

      const idToken = tokens.id_token;

      if (!idToken) {
        console.error("❌ No ID token in response");
        throw new ApiError(errorMessages.USER.ID_TOKEN_GOOGLE_FAILED, 500);
      }

      console.log("🔍 Verifying ID token...");
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: config.GOOGLE_CLIENT_ID,
      });
      console.log("✅ ID token verified");

      if (!ticket.getPayload()) {
        throw new ApiError(errorMessages.USER.TICKET_FAILED, 400);
      }

      const payload = ticket.getPayload();
      console.log("👤 User payload:", {
        email: payload.email,
        sub: payload.sub,
      });
      const { email, sub, given_name, family_name, username, picture } =
        payload;

      console.log("💾 Processing user in database...");
      const { user, newUser } = await userDb.loginGoogleService({ ...payload });
      console.log(`✅ User ${newUser ? "created" : "found"} - ID: ${user._id}`);

      const accessToken = await userDb.generateAccessToken(user);

      const refreshToken = await userDb.updateRefreshToken(user);

      // Set the cookie
      await userDb.sendCookie(res, refreshToken, 7 * 24 * 60 * 60 * 1000);

      return apiResponse.success(res, successMessages.USER.LOGIN_SUCCESS, 200, {
        accessToken: accessToken,
        newUser: newUser,
        user: {
          id: user._id,
          firstName: user.firstName,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("❌ Google Login Error:", error.message);
      console.error("Stack:", error.stack);
      return apiResponse.error(
        res,
        error.message || errorMessages.USER.SIGNUP_GOOGLE_FAILED,
        error.statusCode || 500
      );
    }
  }

  static async checkUsername(req, res) {
    try {
      const { username } = req.body;

      if (!username) {
        throw new ApiError(errorMessages.USER.USERNAME_NOT_PROVIDED, 400);
      }

      const usernameAvailable = await userDb.checkUsername(username);
      if (!usernameAvailable) {
        return apiResponse.success(
          res,
          successMessages.USER.USERNAME_AVAILABLE,
          200,
          {
            username: username,
            available: true,
          }
        );
      }

      return apiResponse.success(
        res,
        errorMessages.USER.USERNAME_NOT_AVAILABLE,
        200,
        {
          username: username,
          available: false,
        }
      );
    } catch (err) {
      return apiResponse.error(res, err.message, err.statusCode || 500);
    }
  }

  static async addUsername(req, res) {
    try {
      const { username } = req.body;
      const user = req.user;

      if (!username) {
        throw new ApiError(errorMessages.USER.USERNAME_NOT_PROVIDED, 400);
      }
      if (!user) {
        throw new ApiError(errorMessages.USER.USER_NOT_EXIST, 404);
      }
      if (!user.authProviders.includes("google")) {
        throw new ApiError(errorMessages.USER.SIGNUP_GOOGLE_FAILED, 403);
      }

      // Check if username already exists
      const usernameExists = await userDb.checkUsername(username);
      if (usernameExists) {
        throw new ApiError(errorMessages.USER.USERNAME_EXISTS, 409);
      }

      // Update user's username
      const updatedUser = await userDb.updateById(user.id, {
        $set: { username },
      });

      return apiResponse.success(
        res,
        successMessages.USER.USERNAME_AVAILABLE,
        200,
        {
          id: updatedUser._id,
          username: updatedUser.username,
        }
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.USER.USERNAME_NOT_AVAILABLE,
        err.statusCode || 500
      );
    }
  }
}
