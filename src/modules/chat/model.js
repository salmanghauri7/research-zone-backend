import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // Points directly to your existing Workspace model
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true, // Fast history lookups
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- THREAD SPECIFIC FIELDS ---
    // If this is null, it's a main message.
    // If it has an ID, it's a reply to that message.
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
      index: true,
    },
    // Useful for UI: "View 5 replies"
    replyCount: {
      type: Number,
      default: 0,
    },

    // --- 2. NORMAL REPLY (The "Quote" Reply) ---
    // If this is set, the message stays in the MAIN chat,
    // but shows a small preview of the message it's replying to.
    quotedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    content: {
      type: String,
      required: function () {
        // Content is required only if message is not deleted
        return !this.isDeleted;
      },
      trim: true,
      default: "",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    reactions: {
      type: Map,
      of: [mongoose.Schema.Types.ObjectId],
      default: {},
    },

    messageType: {
      type: String,
      enum: ["text", "file", "image"],
      default: "text",
    },

    voiceDuration: {
      type: Number,
    },

    // For papers or images shared during research
    attachments: [
      {
        fileName: String,
        fileKey: String,
        fileSize: Number,
        mimeType: String,
      },
    ],
  },
  { timestamps: true },
);

// This ensures that when you fetch chat history, it is blazing fast
messageSchema.index({ workspaceId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
