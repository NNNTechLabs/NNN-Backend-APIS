const UserModel = require("../models/User");
const WeekModel = require("../models/weeks");
const LeaderboardModel = require("../models/Leaderboard");
const ObjectId = require("mongodb").ObjectId;
const config = require("../config/Config");

const addRewards = async (UserID, Rewards) => {
  const checkDate = new Date(config.QuestEndDate);
  try {
    if (checkDate > new Date()) {
      const getCurrentWeek = await WeekModel.findOne({ isActive: true });
      if (getCurrentWeek) {
        const getUser = await UserModel.findOne({ _id: new ObjectId(UserID) });

        const UserRewardAdd = await UserModel.updateOne(
          { _id: new ObjectId(UserID) },
          { $inc: { rewardCoins: Rewards } }
        );

        // Upsert logic for leaderboard data with increment
        const AddLeaderboardReward = {
          $set: {
            WeekID: getCurrentWeek._id,
            UserID: new ObjectId(UserID),
          },
          $inc: {
            TotalRewards: Rewards,
          },
        };
        const options = { upsert: true, new: true };

        const LeaderboardData = await LeaderboardModel.findOneAndUpdate(
          { WeekID: getCurrentWeek._id, UserID: new ObjectId(UserID) },
          AddLeaderboardReward,
          options
        );

        if (getUser.MySquadID && getUser.MySquadID.trim()) {
          // Logic for when MySquadID is present and not empty
        }

        if (getUser.FriendSquadID && getUser.FriendSquadID.trim()) {
          // Logic for when FriendSquadID is present and not empty
          const getFriendUser = await User.findOne({
            FriendSquadID: getUser.FriendSquadID,
          });
        }
        return UserRewardAdd;
      }
    }
  } catch (error) {
    console.log(error);
    return null;
  }
};

const useRewards = async (UserID, Rewards) => {
  try {
    await User.updateOne({ _id: userID }, { ...payload, updated: Date.now() });
    return User.findOne({ _id: userID });
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = {
  addRewards,
};
