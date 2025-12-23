import mongoose from "mongoose";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import BaseRepository from "../../utils/baseRepository.js";

dayjs.extend(relativeTime);

export default class workspaceServices extends BaseRepository {
  constructor(model) {
    super(model);
  }

  async createWorkspace({ title, user }) {
    const workspace = await this.create({
      title,
      owner: user.id,
    });
    return workspace;
  }

  async getOwnerWorkspaces(user) {
    const pipeline = [
      { $match: { owner: new mongoose.Types.ObjectId(user.id) } },
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
}
