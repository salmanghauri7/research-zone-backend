import mongoose from "mongoose";
import Workspace from "../../modules/workspaces/model.js";
import SavedPaper from "../../modules/workspaces/saved-papers/model.js";
import workspaceServices from "../../modules/workspaces/services.js";

const workspaceDb = new workspaceServices(Workspace);

const resolvers = {
  Query: {
    async userDashboardStats(_parent, _args, context) {
      if (!context.user) {
        throw new Error("Authentication required");
      }

      const userId = new mongoose.Types.ObjectId(context.user.id);
      
      const [totalWorkspaces, totalPapers] = await Promise.all([
        Workspace.countDocuments({
          $or: [{ owner: userId }, { "members.user": userId }],
        }),
        SavedPaper.countDocuments({ userId }),
      ]);

      return { totalWorkspaces, totalPapers };
    },

    /**
     * Resolves the list of all workspaces the authenticated user belongs to.
     * Reuses the same service method as GET /api/workspaces/all.
     */
    async allWorkspaces(_parent, _args, context) {
      if (!context.user) {
        throw new Error("Authentication required");
      }

      return workspaceDb.getAllWorkspaces(context.user);
    },

    /**
     * Resolves the full workspace dashboard payload.
     * Reuses the same service method as GET /api/workspaces/:workspaceId/dashboard.
     */
    async workspaceDashboard(_parent, { workspaceId }, context) {
      if (!context.user) {
        throw new Error("Authentication required");
      }

      return workspaceDb.getWorkspaceDashboard({
        workspaceId,
        userId: context.user.id,
      });
    },
  },
};

export default resolvers;
