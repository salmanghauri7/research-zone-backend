import BaseRepository from "../../utils/baseRepository.js";

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
}
