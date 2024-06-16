const csv = require("fast-csv");
const config = require("../config/Config");
const TelegramQuestModel = require("../models/TelegramQuest");
const TwitterQuestModel = require("../models/TwitterQuest");
const DiscordQuestModel = require("../models/DiscordQuest");
const UserTelegramQuestModel = require("../models/UserTelegramQuest");
const UserTwitterQuestModel = require("../models/UserTwitterQuest");
const UserDiscordQuestModel = require("../models/UserDiscordQuest");
const UserService = require("../service/user");
const RewardService = require("../service/Rewards");
const ObjectId = require("mongoose").Types.ObjectId;

const importTwitterData = async (req, res) => {
  var fs = require("fs");
  const filePath = req.file.path;
  let fileRows = [];
  let prePresentCodes = [];
  let counter = 0;

  csv
    .parseFile(filePath)
    .on("data", function (data) {
      let missionName = data[0].trim();
      let Link = data[1].trim();
      let Follow = data[2].trim() == 0 ? false : true;
      let Like = data[3].trim() == 0 ? false : true;
      let Retweet = data[4].trim() == 0 ? false : true;
      let Comment = data[5].trim() == 0 ? false : true;
      let FollowRewards = data[6].trim();
      let LikeRewards = data[7].trim();
      let RetweetRewards = data[8].trim();
      let CommentRewards = data[9].trim();

      if (counter != 0) {
        fileRows.push({
          missionName,
          Link,
          Follow,
          Like,
          Retweet,
          Comment,
          FollowRewards,
          LikeRewards,
          RetweetRewards,
          CommentRewards,
        });
      }
      counter++;
    })
    .on("end", async function () {
      fs.unlinkSync(filePath);
      const processingResults = await Promise.all(
        fileRows.map(
          async ({
            missionName,
            Link,
            Follow,
            Like,
            Retweet,
            Comment,
            FollowRewards,
            LikeRewards,
            RetweetRewards,
            CommentRewards,
          }) => {
            let post = await TwitterQuestModel.findOne({ Link: Link });
            if (post) {
              prePresentCodes.push(Link);
            } else {
              const newPost = new TwitterQuestModel({
                missionName: missionName,
                Link: Link,
                Follow: Follow,
                Like: Like,
                Retweet: Retweet,
                Comment: Comment,
                FollowRewards: FollowRewards,
                LikeRewards: LikeRewards,
                RetweetRewards: RetweetRewards,
                CommentRewards: CommentRewards,
              });
              await newPost.save();
            }
          }
        )
      );

      res.send({
        status: true,
        message: "Data Imported.",
        prePresentCodes,
      });
    });
};
const importDiscordData = async (req, res) => {
  var fs = require("fs");
  const filePath = req.file.path;
  let fileRows = [];
  let prePresentCodes = [];
  let counter = 0;

  csv
    .parseFile(filePath)
    .on("data", function (data) {
      let missionName = data[0].trim();
      let channelLink = data[1].trim();
      let rewardPoints = data[2].trim();
      if (counter != 0) {
        fileRows.push({ missionName, channelLink, rewardPoints });
      }
      counter++;
    })
    .on("end", async function () {
      fs.unlinkSync(filePath);
      const processingResults = await Promise.all(
        fileRows.map(async ({ missionName, channelLink, rewardPoints }) => {
          let post = await DiscordQuestModel.findOne({ Link: channelLink });
          if (post) {
            prePresentCodes.push(channelLink);
          } else {
            const newPost = new DiscordQuestModel({
              missionName: missionName,
              Link: channelLink,
              Rewards: rewardPoints,
              Type: 0,
            });
            await newPost.save();
          }
        })
      );

      res.send({
        status: true,
        message: "Data Imported.",
        prePresentCodes,
      });
    });
};
const importTelegramData = async (req, res) => {
  var fs = require("fs");
  const filePath = req.file.path;
  let fileRows = [];
  let prePresentCodes = [];
  let counter = 0;

  csv
    .parseFile(filePath)
    .on("data", function (data) {
      let missionName = data[0].trim();
      let channelLink = data[1].trim();
      let rewardPoints = data[2].trim();
      if (counter != 0) {
        fileRows.push({ missionName, channelLink, rewardPoints });
      }
      counter++;
    })
    .on("end", async function () {
      fs.unlinkSync(filePath);
      const processingResults = await Promise.all(
        fileRows.map(async ({ missionName, channelLink, rewardPoints }) => {
          let post = await TelegramQuestModel.findOne({ Link: channelLink });
          if (post) {
            prePresentCodes.push(channelLink);
          } else {
            const newPost = new TelegramQuestModel({
              missionName: missionName,
              Link: channelLink,
              Rewards: rewardPoints,
              Type: 0,
            });
            await newPost.save();
          }
        })
      );

      res.send({
        status: true,
        message: "Data Imported.",
        prePresentCodes,
      });
    });
};
const getSocialQuestList = async (req, res) => {
  try {
    const userDetail = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    if (!userDetail)
      return res.send({ status: false, message: "something went wrong!" });

    const UserID = req.userDetails._id;
    //console.log(UserID);
    const DiscordData = await DiscordQuestModel.aggregate([
      {
        $lookup: {
          from: "userdiscordquests", // the name of the UserDiscordQuestModel collection
          let: { questId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$MissionID", "$$questId"] },
                    { $eq: ["$UserID", UserID] },
                  ],
                },
              },
            },
          ],
          as: "userQuest",
        },
      },
      {
        $unwind: {
          path: "$userQuest",
          //includeArrayIndex: "userQuest",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isDone: {
            $cond: {
              //if: { $eq: ["$userQuest", null] },
              if: { $eq: [{ $type: "$userQuest" }, "missing"] },
              then: 0,
              else: "$userQuest.IsDone",
            },
          },
        },
      },
      {
        $project: {
          userQuest: 0,
          // add any other fields from DiscordQuestModel you want to include/exclude
        },
      },
      {
        $sort: { missionName: 1 },
      },
    ]);

    //const DiscordData = await DiscordQuestModel.find().sort({ link: 1 });

    // Fetch and sort data from TelegramQuestModel by 'link'
    //const TelegramData = await TelegramQuestModel.find().sort({ link: 1 });
    const TelegramData = await TelegramQuestModel.aggregate([
      {
        $lookup: {
          from: "usertelegramquests", // the name of the UserDiscordQuestModel collection
          let: { questId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$MissionID", "$$questId"] },
                    { $eq: ["$UserID", UserID] },
                  ],
                },
              },
            },
          ],
          as: "userQuest",
        },
      },
      {
        $unwind: {
          path: "$userQuest",
          //includeArrayIndex: "userQuest",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isDone: {
            $cond: {
              //if: { $eq: ["$userQuest", null] },
              if: { $eq: [{ $type: "$userQuest" }, "missing"] },
              then: 0,
              else: "$userQuest.IsDone",
            },
          },
        },
      },
      {
        $project: {
          userQuest: 0,
          // add any other fields from DiscordQuestModel you want to include/exclude
        },
      },
      {
        $sort: { missionName: 1 },
      },
    ]);

    // Fetch and sort data from TwitterQuestModel by 'follow', 'like', 'comment', 'retweet'
    /*
    const TwitterData = await TwitterQuestModel.find().sort({
      follow: 1,
      like: 1,
      comment: 1,
      retweet: 1,
    });
    */
    const TwitterData = await TwitterQuestModel.aggregate([
      {
        $lookup: {
          from: "usertwitterquests", // the name of the UserDiscordQuestModel collection
          let: { questId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$MissionID", "$$questId"] },
                    { $eq: ["$UserID", UserID] },
                  ],
                },
              },
            },
          ],
          as: "userQuest",
        },
      },
      {
        $unwind: {
          path: "$userQuest",
          //includeArrayIndex: "userQuest",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isDone: {
            $cond: {
              //if: { $eq: ["$userQuest", null] },
              if: { $eq: [{ $type: "$userQuest" }, "missing"] },
              then: 0,
              else: "$userQuest.IsDone",
            },
          },
        },
      },
      {
        $project: {
          userQuest: 0,
          // add any other fields from DiscordQuestModel you want to include/exclude
        },
      },
      {
        $sort: { missionName: 1 },
      },
    ]);

    return res.send({
      status: true,
      DiscordData: DiscordData,
      TelegramData: TelegramData,
      TwitterData: TwitterData,
      DiscordAuth: userDetail.discord_name ? true : false,
      TelegramAuth: userDetail.twitter_username ? true : false,
      TwitterAuth: userDetail.telegram_username ? true : false,
      QuestEndDate: config.QuestEndDate,
    });
  } catch (e) {
    return res.send({ status: false, message: "Error In Call" + e.message });
  }
};
const claimReward = async (req, res) => {
  try {
    const userDetail = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    if (!userDetail)
      return res.send({ status: false, message: "something went wrong!" });

    const currentDate = new Date();
    const ClaimType = req.body.ClaimType; //1 for verify and 2 for claim reward.
    const ClaimCategory = req.body.ClaimCategory; //1 for telegarm, 2 discord and 3 for twitter.
    const UserID = req.userDetails._id;
    const MissionID = new ObjectId(req.body.MissionID);

    let MissionData = "";
    if (ClaimCategory == 1) {
      MissionData = await TelegramQuestModel.findOne({
        _id: MissionID,
      });
    } else if (ClaimCategory == 2) {
      MissionData = await DiscordQuestModel.findOne({
        _id: MissionID,
      });
    } else if (ClaimCategory == 3) {
      MissionData = await TwitterQuestModel.findOne({
        _id: MissionID,
      });
    }

    if (ClaimType == 1) {
      //check is mission already apply for verified.
      if (ClaimCategory == 1) {
        const checkRec = await UserTelegramQuestModel.findOne({
          UserID: UserID,
          QuestID: MissionID,
          IsDone: { $in: [1, 2] },
          /*
          $or: [
            { IsDone: 1 },
            { IsDone: 2 }
          ]
          */
        });
        if (checkRec) {
          return res.send({
            status: false,
            message: "You already request to verify the reward request",
          });
        } else {
          const newPost = new UserTelegramQuestModel({
            UserID: UserID,
            QuestID: MissionID,
            IsDone: 1,
          });
          await newPost.save();
        }
      } else if (ClaimCategory == 2) {
        const checkRec = await UserDiscordQuestModel.findOne({
          UserID: UserID,
          QuestID: MissionID,
          IsDone: { $in: [1, 2] },
        });
        if (checkRec) {
          return res.send({
            status: false,
            message: "You already request to verify the reward request",
          });
        } else {
          const newPost = new UserDiscordQuestModel({
            UserID: UserID,
            QuestID: MissionID,
            IsDone: 1,
          });
          await newPost.save();
        }
      } else if (ClaimCategory == 3) {
        const checkRec = await UserTwitterQuestModel.findOne({
          UserID: UserID,
          QuestID: MissionID,
          IsDone: { $in: [1, 2] },
        });
        if (checkRec) {
          return res.send({
            status: false,
            message: "You already request to verify the reward request",
          });
        } else {
          const newPost = new UserTwitterQuestModel({
            UserID: UserID,
            QuestID: MissionID,
            IsDone: 1,
          });
          await newPost.save();
        }
      }
    } else if (ClaimType == 2) {
      if (ClaimCategory == 1) {
        const checkRec = await UserTelegramQuestModel.findOne({
          UserID: UserID,
          QuestID: MissionID,
          IsDone: 2,
        });
        if (checkRec) {
          return res.send({
            status: false,
            message: "You are not able to claim reward.",
          });
        } else {
          //transfer reward and set

          const TotalRewards =
            MissionData.FollowRewards +
            MissionData.LikeRewards +
            MissionData.RetweetRewards +
            MissionData.CommentRewards;
          const addReward = await RewardService.addRewards(
            UserID,
            TotalRewards
          );
          const newPost = new UserTelegramQuestModel({
            UserID: UserID,
            QuestID: MissionID,
            IsDone: 3,
          });
          await newPost.save();
        }
      } else if (ClaimCategory == 2) {
        const checkRec = await UserDiscordQuestModel.findOne({
          UserID: UserID,
          QuestID: MissionID,
          IsDone: 2,
        });
        if (checkRec) {
          return res.send({
            status: false,
            message: "You are not able to claim reward.",
          });
        } else {
          //transfer reward and set
          const TotalRewards = MissionData.Rewards;
          const addReward = await RewardService.addRewards(
            UserID,
            TotalRewards
          );
          const newPost = new UserDiscordQuestModel({
            UserID: UserID,
            QuestID: MissionID,
            IsDone: 3,
          });
          await newPost.save();
        }
      } else if (ClaimCategory == 3) {
        const checkRec = await UserTwitterQuestModel.findOne({
          UserID: UserID,
          QuestID: MissionID,
          IsDone: 2,
        });
        if (checkRec) {
          return res.send({
            status: false,
            message: "You are not able to claim reward.",
          });
        } else {
          //transfer reward and set
          const TotalRewards = MissionData.Rewards;
          const addReward = await RewardService.addRewards(
            UserID,
            TotalRewards
          );
          const newPost = new UserTwitterQuestModel({
            UserID: UserID,
            QuestID: MissionID,
            IsDone: 3,
          });
          await newPost.save();
        }
      }
    } else {
      return res.send({ status: false, message: "Error in sending request" });
    }

    const DiscordData = await DiscordQuestModel.aggregate([
      {
        $lookup: {
          from: "userdiscordquests", // the name of the UserDiscordQuestModel collection
          let: { questId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$MissionID", "$$questId"] },
                    { $eq: ["$UserID", UserID] },
                  ],
                },
              },
            },
          ],
          as: "userQuest",
        },
      },
      {
        $unwind: {
          path: "$userQuest",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isDone: {
            $cond: {
              if: { $eq: [{ $type: "$userQuest" }, "missing"] },
              then: 0,
              else: "$userQuest.IsDone",
            },
          },
        },
      },
      {
        $project: {
          userQuest: 0,
          // add any other fields from DiscordQuestModel you want to include/exclude
        },
      },
      {
        $sort: { missionName: 1 },
      },
    ]);

    // Fetch and sort data from TelegramQuestModel by 'link'
    const TelegramData = await TelegramQuestModel.aggregate([
      {
        $lookup: {
          from: "usertelegramquests", // the name of the UserDiscordQuestModel collection
          let: { questId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$MissionID", "$$questId"] },
                    { $eq: ["$UserID", UserID] },
                  ],
                },
              },
            },
          ],
          as: "userQuest",
        },
      },
      {
        $unwind: {
          path: "$userQuest",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isDone: {
            $cond: {
              if: { $eq: [{ $type: "$userQuest" }, "missing"] },
              then: 0,
              else: "$userQuest.IsDone",
            },
          },
        },
      },
      {
        $project: {
          userQuest: 0,
          // add any other fields from DiscordQuestModel you want to include/exclude
        },
      },
      {
        $sort: { missionName: 1 },
      },
    ]);

    // Fetch and sort data from TwitterQuestModel by 'follow', 'like', 'comment', 'retweet'
    const TwitterData = await TwitterQuestModel.aggregate([
      {
        $lookup: {
          from: "usertwitterquests", // the name of the UserDiscordQuestModel collection
          let: { questId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$MissionID", "$$questId"] },
                    { $eq: ["$UserID", UserID] },
                  ],
                },
              },
            },
          ],
          as: "userQuest",
        },
      },
      {
        $unwind: {
          path: "$userQuest",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          isDone: {
            $cond: {
              if: { $eq: [{ $type: "$userQuest" }, "missing"] },
              then: 0,
              else: "$userQuest.IsDone",
            },
          },
        },
      },
      {
        $project: {
          userQuest: 0,
          // add any other fields from DiscordQuestModel you want to include/exclude
        },
      },
      {
        $sort: { missionName: 1 },
      },
    ]);

    return res.send({
      status: true,
      DiscordData: DiscordData,
      TelegramData: TelegramData,
      TwitterData: TwitterData,
      DiscordAuth: userDetail.discord_name ? true : false,
      TelegramAuth: userDetail.twitter_username ? true : false,
      TwitterAuth: userDetail.telegram_username ? true : false,
    });
  } catch {
    return res.send({ status: false, data: null });
  }
};

module.exports = {
  importTwitterData,
  importDiscordData,
  importTelegramData,
  getSocialQuestList,
  claimReward,
};
