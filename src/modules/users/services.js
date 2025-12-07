import { config, constants } from "../../constants/config.js";
import { errorMessages } from "../../constants/messages.js";
import { ApiError } from "../../utils/apiError.js";
import BaseRepository from "../../utils/baseRepository.js";
import { signupOTPEmailTemp } from "../../utils/emailTemplates/signupOtpTemp.js";
import { decodeJWT, generateJWT } from "../../utils/generateJWT.js";
import generateOTP from "../../utils/generateOtp.js";
import { sendEmail } from "../../utils/sendMail.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export default class userservices extends BaseRepository {
  constructor(model) {
    super(model);
  }

  // New method to handle the complete signup business logic
  async signupUser(userData) {
    const { email, firstName, lastName, password, username } = userData;

    // 1. Find the user
    const user = await this.findOne({ email });

    // 2. Business Rule: Check if user is already verified
    if (user && user.isVerified) {
      throw new ApiError(errorMessages.USER.USER_EXISTS, 409);
    }

    const userByUsername = await this.findOne({ username });
    if (userByUsername && userByUsername.email !== email) {
      throw new ApiError(errorMessages.USER.USERNAME_EXISTS, 409);
    }

    // 3. Business Logic: Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const dataToSave = {
      email,
      firstName,
      lastName,
      username,
      otp,
      otpExpiresAt,
      passwordHash: await this.hashPassword(password),
    };

    // 4. Business Logic: Create or Update based on existence
    if (user && !user.isVerified) {
      // Update existing unverified user
      await this.updateOne(
        { email },
        { $set: dataToSave }, // Use $set to update all fields
        { runValidators: true }
      );
    } else {
      // Create new user
      await this.create(dataToSave);
    }

    // 5. Business Logic: Send verification email (AFTER saving user, but throw if it fails)
    try {
      await sendEmail(
        email,
        constants.VERIFICATION_EMAIL_SUBJECT,
        signupOTPEmailTemp(firstName, otp)
      );
    } catch (error) {
      console.error("Email sending failed, cleaning up user:", error);
      // Delete the user if email fails
      await this.deleteOne({ email });
      throw error;
    }

    // The service layer often returns a success indicator or sanitized data
    return dataToSave;
  }

  async resendOtp(token) {
    const { id, firstName, email } = decodeJWT(token);

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Send email first, then update only if successful
    try {
      await sendEmail(
        email,
        constants.VERIFICATION_EMAIL_SUBJECT,
        signupOTPEmailTemp(firstName, otp)
      );

      // Update OTP only after email is sent successfully
      await this.updateOne(
        { email },
        { $set: { otp, otpExpiresAt } },
        { runValidators: true }
      );
    } catch (error) {
      console.error("Failed to resend OTP:", error);
      throw error;
    }
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    return hashPassword;
  }

  async verifyOtp(otp) {
    const user = await this.findOne({ otp });
    if (!user) {
      throw new ApiError(errorMessages.USER.OTP_VERIFICATION_FAILED, 400);
    }
    if (user.otpExpiresAt < Date.now()) {
      throw new ApiError(errorMessages.USER.OTP_EXPIRED, 400);
    }

    const refreshToken = crypto.randomBytes(32).toString("hex");

    await this.updateById(user._id, {
      $set: {
        otpExpiresAt: null,
        otp: null,
        isVerified: true,
        refreshToken: refreshToken,
      },
    });

    return { user, refreshToken };
  }

  async verifyCredentials(email, username, password) {
    const user = await this.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (!user) {
      throw new ApiError(errorMessages.USER.INVALID_CREDENTIALS, 401);
    }

    const isPasswordCorrect = await this.comparePassword(
      password,
      user.passwordHash
    );
    if (!isPasswordCorrect)
      throw new ApiError(errorMessages.USER.INVALID_CREDENTIALS, 401);

    if (!user.isVerified)
      throw new ApiError(errorMessages.USER.USER_NOT_VERIFIED, 403);

    return user;
  }

  async comparePassword(password, userPassword) {
    const isPasswordCorrect = await bcrypt.compare(password, userPassword);
    if (!isPasswordCorrect) return false;
    return true;
  }

  async updateRefreshToken(user) {
    const refreshToken = crypto.randomBytes(32).toString("hex");
    await this.updateById(user._id, {
      $set: { refreshToken: refreshToken },
    });
    return refreshToken;
  }

  async generateAccessToken(user) {
    const payload = {
      id: user._id,
      firstName: user.firstName,
      username: user.username,
      email: user.email,
      authProviders: user.authProviders,
    };

    const accessToken = generateJWT(payload, { expiresIn: "15m" });
    return accessToken;
  }

  async sendCookie(res, token, maxAge) {
    res.cookie("authCookie", token, {
      httpOnly: true,
      sameSite: config.NODE_ENV === "production" ? "none" : "lax", // allow cross-site
      secure: config.NODE_ENV === "production" ? true : false,
      path: "/",
      maxAge: maxAge, // 7 days
    });
  }

  async getUserFromToken(token) {
    const user = this.findOne({ token });
    if (!user) {
      throw new ApiError(errorMessages.USER.USER_NOT_EXIST, 400);
    }
    return user;
  }

  async loginGoogleService(userData) {
    let user = await this.findOne({ email: userData.email });
    let newUser = false;

    if (user) {
      // If user signed up with local and Google not linked yet
      if (!user.authProviders.includes("google")) {
        user = await this.findOneAndUpdate(
          { email: user.email },
          {
            $addToSet: { authProviders: "google" }, // add without duplicates
            $set: {
              firstName: userData.given_name,
              lastName: userData.family_name,
              profilePictureUrl: userData.picture,
            },
          },
          { new: true }
        );
      }

      // get updated record

      return { user, newUser };
    }

    // No user? Create a new Google account
    user = await this.create({
      email: userData.email,
      firstName: userData.given_name,
      lastName: userData.family_name,
      profilePictureUrl: userData.picture,
      authProviders: ["google"],
      isVerified: true,
    });

    newUser = true;
    return { user, newUser };
  }

  async checkUsername(username) {
    return await this.findOne({ username });
  }
}
