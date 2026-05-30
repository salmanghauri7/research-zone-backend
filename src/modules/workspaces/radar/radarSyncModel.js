import mongoose from "mongoose";

const radarSyncLogSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    status: {
      type: String,
      enum: ["idle", "running", "failed"],
      default: "idle",
    },
  },
  { timestamps: true },
);

radarSyncLogSchema.index({ workspaceId: 1 }, { unique: true });

const RadarSyncLog = mongoose.model("RadarSyncLog", radarSyncLogSchema);
export default RadarSyncLog;
