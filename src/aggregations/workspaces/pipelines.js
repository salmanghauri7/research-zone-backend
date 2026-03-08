import mongoose from "mongoose";

export const buildOwnerWorkspacesPipeline = (userId) => [
  {
    $match: {
      owner: new mongoose.Types.ObjectId(userId),
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

export const buildAllWorkspacesPipeline = (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  return [
    {
      $match: {
        $or: [{ owner: userObjectId }, { "members.user": userObjectId }],
      },
    },
    {
      $project: {
        title: 1,
        owner: 1,
        createdAt: 1,
        members: { $size: "$members" },
        color: 1,
        isOwner: {
          $eq: ["$owner", userObjectId],
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ];
};
