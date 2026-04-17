import { z } from "zod";

/**
 * User Module Validation Schemas
 * Centralized validation for all user endpoints
 */

// ============ AUTHENTICATION SCHEMAS ============

/**
 * Signup validation schema
 * Validates: email, password, firstName, lastName (optional), username
 */
export const signupSchema = z.object({
  email: z
    .string({
      required_error: "Email is required.",
    })
    .email("Invalid email format."),

  password: z
    .string({
      required_error: "Password is required.",
    })
    .min(8, "Password must be at least 8 characters long.")
    .max(50, "Password cannot exceed 50 characters."),

  firstName: z
    .string({
      required_error: "First name is required.",
    })
    .min(1, "First name cannot be empty.")
    .max(50, "First name cannot exceed 50 characters."),

  lastName: z
    .string()
    .max(50, "Last name cannot exceed 50 characters.")
    .optional(),

  username: z
    .string({
      required_error: "Username is required.",
    })
    .min(3, "Username must be at least 3 characters long.")
    .max(30, "Username cannot exceed 30 characters."),
});

/**
 * Login validation schema
 * Validates: either email or username (at least one required), and password
 */
export const loginSchema = z
  .object({
    email: z.string().email("Invalid email format.").optional(),

    username: z
      .string()
      .min(3, "Username must be at least 3 characters long.")
      .max(30, "Username cannot exceed 30 characters.")
      .optional(),

    password: z
      .string({
        required_error: "Password is required.",
      })
      .min(1, "Password cannot be empty."),
  })
  .refine((data) => !!data.email || !!data.username, {
    message: "Either email or username is required.",
    path: ["email"],
  });

// ============ OTP SCHEMAS ============

/**
 * Verify OTP validation schema
 * Validates: OTP code
 */
export const verifyOtpSchema = z.object({
  otp: z
    .number({
      required_error: "OTP is required.",
      invalid_type_error: "OTP must be a number.",
    })
    .int("OTP must be an integer.")
    .positive("OTP must be a positive number.")
    .or(
      z
        .string()
        .regex(/^\d{4,6}$/, "OTP must be a 4-6 digit code.")
        .transform((val) => parseInt(val, 10)),
    ),
});

/**
 * Resend OTP validation schema
 * Validates: token parameter (extracted from URL)
 */
export const resendOtpSchema = z.object({
  token: z
    .string({
      required_error: "Token is required.",
    })
    .min(1, "Token cannot be empty."),
});

// ============ GOOGLE AUTH SCHEMAS ============

/**
 * Google Login validation schema
 * Validates: authorization code from Google OAuth
 */
export const googleLoginSchema = z.object({
  code: z
    .string({
      required_error: "Authorization code is required.",
    })
    .min(1, "Authorization code cannot be empty."),
});

// ============ USERNAME SCHEMAS ============

/**
 * Check Username Availability validation schema
 * Validates: username to check
 */
export const checkUsernameAvailabilitySchema = z.object({
  username: z
    .string({
      required_error: "Username is required.",
    })
    .min(3, "Username must be at least 3 characters long.")
    .max(30, "Username cannot exceed 30 characters."),
});

/**
 * Add Username validation schema (for OAuth users)
 * Validates: username to be added to existing account
 */
export const addUsernameSchema = z.object({
  username: z
    .string({
      required_error: "Username is required.",
    })
    .min(3, "Username must be at least 3 characters long.")
    .max(30, "Username cannot exceed 30 characters."),
});
