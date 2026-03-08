import mongoose from "mongoose";

export const buildPapersCountByFolderPipeline = (workspaceId) => [
  {
    $match: {
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    },
  },
  {
    $group: {
      _id: "$folderId",
      count: { $sum: 1 },
    },
  },
];

export const returnFoldersAndPapersPipeline = (
  workspaceId,
  folderId = null,
) => {
  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
  const normalizedFolderId =
    folderId && folderId !== "root"
      ? new mongoose.Types.ObjectId(folderId)
      : null;

  return [
    {
      $match: {
        workspaceId: workspaceObjectId,
        parentFolderId: normalizedFolderId,
      },
    },
    {
      $addFields: {
        itemType: "folder",
      },
    },
    {
      $unionWith: {
        coll: "savedpapers",
        pipeline: [
          {
            $match: {
              workspaceId: workspaceObjectId,
              folderId: normalizedFolderId,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    firstName: 1,
                  },
                },
              ],
              as: "userDetails",
            },
          },
          {
            $addFields: {
              savedBy: {
                $ifNull: [
                  { $arrayElemAt: ["$userDetails.firstName", 0] },
                  null,
                ],
              },
            },
          },
          {
            $project: {
              userDetails: 0,
            },
          },
          {
            $addFields: {
              itemType: "paper",
            },
          },
        ],
      },
    },
  ];
};
