import mongoose from "mongoose";

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

    // 6. Metadata & Invite System
    inviteCode: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },
  },
  { timestamps: true }
);

const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;