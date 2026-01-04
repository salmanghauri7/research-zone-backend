import mongoose from "mongoose";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import BaseRepository from "../../utils/baseRepository.js";
import WorkspaceInvitation from "./invitationModel.js";
import { sendEmail } from "../../utils/sendMail.js";
import { invitationTemplate } from "../../utils/emailTemplates/invitationTemp.js";
import { ApiError } from "../../utils/apiError.js";
import { errorMessages } from "../../constants/messages.js";

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
    const pipeline = [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(user.id),
        },
      },
      {
        $project: {
          title: 1,
          owner: 1,
          createdAt: 1,
          members: { $size: "$members" },
          color: 1,
        },
      },
    ];

    let workspaces = await this.aggregate(pipeline);
    return workspaces.map((ws) => ({
      ...ws,
      createdAt: dayjs(ws.createdAt).fromNow(),
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
      (member) => member.user.toString() === email
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
      invitation.token
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
      status: "expired",
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

    // Get workspace
    const workspace = await this.findById(invitation.workspaceId);

    if (!workspace) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_FOUND, 404);
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
      (member) => member.user.toString() === user.id.toString()
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
      status: "accepted",
    });

    return {
      workspaceId: workspace._id,
      workspaceTitle: workspace.title,
      message: "Successfully joined the workspace",
    };
  }
}
