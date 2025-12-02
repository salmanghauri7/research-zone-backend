import { z } from "zod";

// Zod schema for manual user signup
export const signupSchema = z.object({
  // The request body should contain these fields

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

  // lastName is optional based on your Mongoose schema
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
  // Optional: Add regex for username pattern (e.g., alphanumeric only)
  // .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
});

export const loginSchema = z
  .object({
    // Email is optional, but if provided, it must be a valid email
    email: z.string().email("Invalid email format.").optional(),

    // Username is optional, but if provided, it must meet the rules
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long.")
      .max(30, "Username cannot exceed 30 characters.")
      .optional(),

    // Password is always required
    password: z
      .string({
        required_error: "Password is required.",
      })
      .min(1, "Password cannot be empty."), // We just check that it's not empty
  })
  .refine((data) => !!data.email || !!data.username, {
    // This check ensures at least one identifier is provided
    message: "Either email or username is required.",
    // You can attach this error to a specific field
    path: ["email"],
  });
