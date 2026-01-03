import mongoose from "mongoose";
import crypto from "crypto";

const workspaceInvitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  },
  { timestamps: true }
);

// Index for efficient queries
workspaceInvitationSchema.index({ email: 1, workspaceId: 1 });
workspaceInvitationSchema.index({ token: 1 });
workspaceInvitationSchema.index({ expiresAt: 1 });

const WorkspaceInvitation = mongoose.model(
  "WorkspaceInvitation",
  workspaceInvitationSchema
);

export default WorkspaceInvitation;
