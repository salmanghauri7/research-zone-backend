import mongoose from "mongoose";
import crypto from "crypto";

const workspaceSchema = new mongoose.Schema(
  {
    // 1. Basic Identity
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // 2. Ownership & Collaboration
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    color: { type: String },

    // 6. Metadata & Invite System
    inviteCode: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    isPersonalWorkspace: {
      type: Boolean,
      index: true,
    },
  },

  { timestamps: true }
);

workspaceSchema.pre("save", function (next) {
  if (!this.color) {
    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  next();
});

const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;
