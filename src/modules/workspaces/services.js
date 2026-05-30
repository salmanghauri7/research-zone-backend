import mongoose from "mongoose";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import BaseRepository from "../../utils/baseRepository.js";
import WorkspaceInvitation from "./invitationModel.js";
import { sendEmail } from "../../utils/sendMail.js";
import { invitationTemplate } from "../../utils/emailTemplates/invitationTemp.js";
import { ApiError } from "../../utils/apiError.js";
import { errorMessages } from "../../constants/messages.js";
import Message from "../chat/model.js";
import User from "../users/model.js";
import SavedPaper from "./saved-papers/model.js";
import {
  buildAllWorkspacesPipeline,
  buildOwnerWorkspacesPipeline,
} from "../../aggregations/workspaces/pipelines.js";

dayjs.extend(relativeTime);

export default class workspaceServices extends BaseRepository {
  constructor(model) {
    super(model);
  }

  async createWorkspace({ title, user }) {
    const workspace = await this.create({
      title,
      owner: user.id,
      members: [{ user: user.id }],
    });
    return workspace;
  }

  async getOwnerWorkspaces(user) {
    const pipeline = buildOwnerWorkspacesPipeline(user.id);

    let workspaces = await this.aggregate(pipeline);
    return workspaces.map((ws) => ({
      ...ws,
      createdAt: dayjs(ws.createdAt).fromNow(),
    }));
  }

  async getAllWorkspaces(user) {
    const pipeline = buildAllWorkspacesPipeline(user.id);

    let workspaces = await this.aggregate(pipeline);
    return workspaces.map((ws) => ({
      _id: ws._id,
      title: ws.title,
      isOwner: ws.isOwner,
      color: ws.color,
    }));
  }

  async inviteUserToWorkspace({ email, workspaceId, inviter }) {
    // Check if workspace exists and user is owner
    const workspace = await this.findById(workspaceId);
    if (!workspace) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_FOUND, 404);
    }

    if (workspace.owner.toString() !== inviter.id.toString()) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_OWNER, 403);
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
      (member) => member.user.toString() === email,
    );
    if (isMember) {
      throw new ApiError(errorMessages.WORKSPACE.ALREADY_MEMBER, 400);
    }

    // Check if there's already a pending invitation
    const existingInvitation = await WorkspaceInvitation.findOne({
      email,
      workspaceId,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      throw new ApiError(errorMessages.WORKSPACE.INVITATION_EXISTS, 400);
    }

    // Create new invitation
    const invitation = await WorkspaceInvitation.create({
      email,
      workspaceId,
      inviterId: inviter.id,
    });

    // Send invitation email
    const emailHtml = invitationTemplate(
      workspace.title,
      inviter.username || inviter.email,
      invitation.token,
    );

    await sendEmail(email, `Invitation to join ${workspace.title}`, emailHtml);

    return {
      invitationId: invitation._id,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    };
  }

  async verifyInvitationToken(token) {
    // Find invitation by token
    const invitation = await WorkspaceInvitation.findOne({ token });

    if (!invitation) {
      throw new ApiError(errorMessages.WORKSPACE.INVALID_TOKEN, 404);
    }

    // Check if token is already used
    if (invitation.status === "accepted") {
      throw new ApiError(errorMessages.WORKSPACE.TOKEN_ALREADY_USED, 400);
    }

    // Check if token is expired
    if (invitation.status === "expired" || new Date() > invitation.expiresAt) {
      // Mark as expired if not already
      if (invitation.status !== "expired") {
        await WorkspaceInvitation.findByIdAndUpdate(invitation._id, {
          status: "expired",
        });
      }
      throw new ApiError(errorMessages.WORKSPACE.TOKEN_EXPIRED, 400);
    }

    // Get workspace details
    const workspace = await this.findById(invitation.workspaceId, "owner");

    if (!workspace) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_FOUND, 404);
    }

    // Mark invitation as expired (used)
    await WorkspaceInvitation.findByIdAndUpdate(invitation._id, {
      status: "verified",
    });

    return {
      email: invitation.email,
      workspaceId: workspace._id,
      workspaceTitle: workspace.title,
      inviterId: invitation.inviterId,
    };
  }

  async acceptInvitation({ token, user }) {
    // Find invitation by token
    const invitation = await WorkspaceInvitation.findOne({ token });

    if (!invitation) {
      throw new ApiError(errorMessages.WORKSPACE.INVALID_TOKEN, 404);
    }

    // Check if token is already used
    if (invitation.status !== "verified") {
      throw new ApiError(errorMessages.WORKSPACE.TOKEN_NOT_VERIFIED, 400);
    }

    // Check if token is expired
    if (invitation.status === "expired" || new Date() > invitation.expiresAt) {
      // Mark as expired if not already
      if (invitation.status !== "expired") {
        await WorkspaceInvitation.findByIdAndUpdate(invitation._id, {
          status: "expired",
        });
      }
      throw new ApiError(errorMessages.WORKSPACE.TOKEN_EXPIRED, 400);
    }

    // Get workspace
    const workspace = await this.findById(invitation.workspaceId);

    if (!workspace) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_FOUND, 404);
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
      (member) => member.user.toString() === user.id.toString(),
    );

    if (isMember) {
      throw new ApiError(errorMessages.WORKSPACE.ALREADY_MEMBER, 400);
    }

    // Add user to workspace members
    await this.updateById(invitation.workspaceId, {
      $push: { members: { user: user.id } },
    });

    // Mark invitation as accepted
    await WorkspaceInvitation.findByIdAndUpdate(invitation._id, {
      status: "expired",
    });

    return {
      workspaceId: workspace._id,
      workspaceTitle: workspace.title,
      message: "Successfully joined the workspace",
    };
  }

  async leaveWorkspace({ workspaceId, user }) {
    // Find the workspace
    const workspace = await this.findById(workspaceId);

    if (!workspace) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_FOUND, 404);
    }

    // Check if user is a member
    const isMember = workspace.members.some(
      (member) => member.user.toString() === user.id.toString(),
    );

    if (!isMember) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_MEMBER, 400);
    }

    // Check if user is the owner
    const isOwner = workspace.owner.toString() === user.id.toString();

    if (isOwner) {
      // If owner is leaving, delete the entire workspace and all related data
      await Message.deleteMany({ workspaceId });
      await WorkspaceInvitation.deleteMany({ workspaceId });
      await this.deleteById(workspaceId);

      return {
        workspaceId: workspace._id,
        workspaceTitle: workspace.title,
        deleted: true,
      };
    } else {
      // If regular member is leaving, just remove them from members array
      await this.updateById(workspaceId, {
        $pull: { members: { user: user.id } },
      });

      return {
        workspaceId: workspace._id,
        workspaceTitle: workspace.title,
        deleted: false,
      };
    }
  }

  async getWorkspaceDashboard({ workspaceId, userId }) {
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_FOUND, 404);
    }

    const workspace = await this.findById(workspaceId);

    if (!workspace) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_FOUND, 404);
    }

    const isOwner = workspace.owner.toString() === userId.toString();
    const isMember = workspace.members.some(
      (member) => member?.user?.toString() === userId.toString(),
    );

    if (!isOwner && !isMember) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_MEMBER, 403);
    }

    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

    const uniqueMemberIds = new Set(
      workspace.members
        .map((member) => member?.user?.toString())
        .filter(Boolean),
    );
    uniqueMemberIds.add(workspace.owner.toString());

    const memberObjectIds = [...uniqueMemberIds].map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      users,
      paperCountsByUser,
      recentPapersRaw,
      totalPapers,
      activityRaw,
      thisMonthCount,
      lastMonthCount,
    ] = await Promise.all([
      User.find({ _id: { $in: memberObjectIds } })
        .select("_id firstName lastName username email profilePictureUrl")
        .lean(),
      SavedPaper.aggregate([
        {
          $match: {
            workspaceId: workspaceObjectId,
          },
        },
        {
          $group: {
            _id: "$userId",
            papersCount: { $sum: 1 },
          },
        },
      ]),
      SavedPaper.find({ workspaceId: workspaceObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("_id title authors createdAt")
        .lean(),
      SavedPaper.countDocuments({ workspaceId: workspaceObjectId }),
      SavedPaper.aggregate([
        {
          $match: {
            workspaceId: workspaceObjectId,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            value: { $sum: 1 },
          },
        },
      ]),
      SavedPaper.countDocuments({
        workspaceId: workspaceObjectId,
        createdAt: { $gte: thisMonthStart },
      }),
      SavedPaper.countDocuments({
        workspaceId: workspaceObjectId,
        createdAt: { $gte: lastMonthStart, $lt: thisMonthStart },
      }),
    ]);

    const paperCountMap = new Map(
      paperCountsByUser.map((item) => [item._id.toString(), item.papersCount]),
    );

    const topContributors = users
      .map((member) => {
        const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim();
        const displayName = fullName || member.username || member.email;
        const papersCount = paperCountMap.get(member._id.toString()) || 0;

        return {
          _id: member._id,
          name: displayName,
          email: member.email,
          avatar: member.profilePictureUrl,
          role:
            workspace.owner.toString() === member._id.toString()
              ? "Owner"
              : "Member",
          papersCount,
        };
      })
      .sort((a, b) => {
        if (b.papersCount !== a.papersCount) {
          return b.papersCount - a.papersCount;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);

    const recentPapers = recentPapersRaw.map((paper) => ({
      _id: paper._id,
      title: paper.title,
      author: paper.authors || "Unknown authors",
      savedAt: paper.createdAt,
      tag: "Research",
    }));

    const activityMap = new Map(activityRaw.map((item) => [item._id, item.value]));
    const activityData = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const currentDate = new Date(sevenDaysAgo);
      currentDate.setDate(sevenDaysAgo.getDate() + dayOffset);

      const dayKey = currentDate.toISOString().split("T")[0];
      activityData.push({
        day: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
        value: activityMap.get(dayKey) || 0,
      });
    }

    const activityChange =
      lastMonthCount === 0
        ? thisMonthCount > 0
          ? 100
          : 0
        : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);

    return {
      workspace: {
        _id: workspace._id,
        title: workspace.title,
        description: null,
        color: workspace.color,
        createdAt: workspace.createdAt,
      },
      stats: {
        totalMembers: uniqueMemberIds.size,
        totalPapers,
        activityChange,
      },
      topContributors,
      recentPapers,
      activityData,
    };
  }

  async checkUserWorkspaceRole({ workspaceId, user }) {
    // Find the workspace
    const workspace = await this.findById(workspaceId);

    if (!workspace) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_FOUND, 404);
    }

    // Check if user is the owner
    const isOwner = workspace.owner.toString() === user.id.toString();

    // Check if user is a member
    const isMember = workspace.members.some(
      (member) => member.user.toString() === user.id.toString(),
    );

    return {
      workspaceId: workspace._id,
      workspaceTitle: workspace.title,
      isOwner,
      isMember,
      role: isOwner ? "owner" : isMember ? "member" : "none",
    };
  }
}
