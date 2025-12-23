import mongoose from "mongoose";
import dotenv from "dotenv";
import Workspace from "../src/modules/workspaces/model.js";
dotenv.config();

async function addColors() {
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#f59e0b",
    "#10b981",
  ];
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo Db connected");
    const workspaces = await Workspace.find({
      $or: [{ color: { $exists: false } }, { color: null }],
    });
    console.log(`Found ${workspaces.length} workspaces to update.`);

    const updatedPromises = workspaces.map((workspace) => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      return Workspace.updateOne(
        { _id: workspace._id },
        { $set: { color: randomColor } }
      );
    });

    await Promise.all(updatedPromises);

    console.log("Migration successful! All workspaces now have colors.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addColors();
