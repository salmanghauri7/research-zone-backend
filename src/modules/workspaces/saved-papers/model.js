import mongoose from "mongoose";

const savedPaperSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null, // null means paper is at root level
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authors: {
      type: String,
      default: "",
    },
    published: {
      type: String,
      default: "",
    },

    link: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
    },
    summaryGenerated: {
      type: Boolean,
    },
  },
  { timestamps: true },
);

// Compound index for efficient queries
savedPaperSchema.index({ workspaceId: 1, folderId: 1 });

const SavedPaper = mongoose.model("SavedPaper", savedPaperSchema);

export default SavedPaper;
