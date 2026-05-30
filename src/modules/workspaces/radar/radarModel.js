import mongoose from "mongoose";

const radarSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "workspace",
      required: true,
    },
    category: { type: String, required: true },
    alertType: {
      type: [String],
      enum: ["contradiction", "relevance"],
    },
    papersScanned: {
      type: Number,
      default: 0,
    },
    newPapers: [
      {
        authors: { type: [String], required: true },
        title: { type: String, required: true },
        link: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

const Radar = mongoose.model("Radar", radarSchema);
export default Radar;
