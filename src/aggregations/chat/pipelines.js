export const buildSearchMessagesPipeline = ({
  query,
  matchStage,
  paginationLimit,
}) => [
  {
    $search: {
      index: "message_search",
      text: {
        query,
        path: "content",
        fuzzy: { maxEdits: 2 },
      },
    },
  },
  {
    $match: matchStage,
  },
  { $sort: { _id: -1 } },
  {
    $lookup: {
      from: "users",
      localField: "sender",
      foreignField: "_id",
      as: "sender",
    },
  },
  { $unwind: "$sender" },
  { $limit: paginationLimit + 1 },
  {
    $project: {
      _id: 1,
      workspaceId: 1,
      parentMessageId: 1,
      replyCount: 1,
      quotedMessageId: 1,
      content: 1,
      isEdited: 1,
      isDeleted: 1,
      reactions: 1,
      messageType: 1,
      voiceDuration: 1,
      createdAt: 1,
      updatedAt: 1,
      "sender._id": 1,
      "sender.firstName": 1,
      "sender.profilePictureUrl": 1,
    },
  },
];
