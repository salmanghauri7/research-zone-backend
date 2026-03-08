import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    parentFolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
        default: null, // null for root folders
    },
}, { timestamps: true });

const Folder = mongoose.model("Folder", folderSchema);

export default Folder;
