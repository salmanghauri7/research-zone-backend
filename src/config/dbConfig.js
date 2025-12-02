import mongoose from "mongoose";
import { config } from "../constants/config.js";

export default async function connectDb() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("✅ MongoDb connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}
