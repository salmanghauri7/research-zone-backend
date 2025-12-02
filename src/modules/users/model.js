import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required."],
    unique: true,
    index: true, // Ensures fast lookups by email
    lowercase: true, // Stores all emails in lowercase for consistency
    trim: true, // Removes whitespace from the beginning and end
  },

  passwordHash: {
    type: String,
    // This is optional by default, so we don't need 'required: false'
    // It will be 'null' or 'undefined' if not provided.
  },

  firstName: {
    type: String,
    required: [true, "First name is required."],
    trim: true,
  },

  lastName: {
    type: String,
    trim: true,
    // Optional
  },

  username: {
    type: String,
    // required: [true, "Username is required."],
    unique: true,
    index: true, // Ensures fast lookups by username
    lowercase: true,
    trim: true,
    sparse: true,
  },

  profilePictureUrl: {
    type: String,
    default: null,
  },

  authProviders: {
    type: [String],
    enum: ["local", "google", "github", "kaggle"],
    default: ["local"],
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  otp: {
    type: Number,
    default: false,
  },

  otpExpiresAt: {
    type: Date,
  },

  refreshToen: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// userSchema.pre("save", async function (next) {
//   const user = this;
//   try {
//     if (!user.isModified("passwordHash")) {
//       return next();
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashed = await bcrypt.hash(user.passwordHash, salt);
//     user.passwordHash = hashed;

//     next();
//   } catch (err) {
//     // this error will be handled by global api error handler
//     next(err);
//   }
// });

// Create the model from the schema
const User = mongoose.model("User", userSchema);

export default User;
