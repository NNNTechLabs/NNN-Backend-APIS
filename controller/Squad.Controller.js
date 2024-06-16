var jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserService = require("../service/user");
const config = require("../config/Config");
const RewardService = require("../service/Rewards");
const ObjectId = require("mongoose").Types.ObjectId;
const WeekModel = require("../models/weeks");
const SquadModel = require("../models/Squad");
const SquadHistoryModel = require("../models/SquadHistory");
const LeaderboardModel = require("../models/Leaderboard");
// Helper function to generate a random alphanumeric string prefixed with "SQA" and converted to uppercase
function generateSquadRandomString(length) {
  const randomString = crypto
    .randomBytes(length)
    .toString("hex")
    .slice(0, length)
    .toUpperCase();
  return `SQA${randomString}`;
}

const createSquad = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    const SquadName = req.body.SquadName.trim();
    if (!getUserDetails || SquadName == "")
      return res.send({ status: false, message: "squad name is missing" });

    if (getUserDetails.MySquadID && getUserDetails.MySquadID.trim()) {
      return res.send({
        status: false,
        message: "Squad already generated!",
      });
    }
    const MySquadID = generateSquadRandomString(7);

    const newSquad = new SquadModel({
      SquadCode: MySquadID,
      SquadName: SquadName,
      UserID: req.userDetails._id,
      IsLeftByOwner: false,
    });

    const newSquadData = await newSquad.save();

    const post = await UserService.updateUser(req.userDetails._id, {
      MySquadID: MySquadID,
    });
    return res.send({ status: true, newSquad: newSquadData });
  } catch (error) {
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const JoinSquadByCode = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });

    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    const getSquad = await SquadModel.findOne({
      SquadCode: req.body.SquadCode.trim(),
    });

    if (getSquad) {
      const SquadID = getSquad.id;
      const SquadCode = getSquad.SquadCode;
      const getCurrentWeek = await WeekModel.findOne({ isActive: true });
      const post = await UserService.updateUser(req.userDetails._id, {
        MySquadID: "",
        FriendSquadID: SquadCode,
      });
      //if has own squad then IsLeftByOwner is true
      const updateSquad = await SquadModel.updateOne(
        { UserID: req.userDetails._id },
        { IsLeftByOwner: true }
      );
      //if join by link and get reward deduct the reward

      //transfer award to new squad
      const transferRewards = await LeaderboardModel.findOneAndUpdate(
        {
          WeekID: getCurrentWeek._id,
          UserID: req.userDetails._id,
        },
        {
          $set: {
            SQuadID: getSquad._id,
          },
          $setOnInsert: {
            TotalRewards: 0.0,
          },
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create a new document if no document matches the query
        }
      );

      return res.send({
        status: true,
        userDetails: post,
        SquadInfo: getSquad,
        message: "You Joined The Squad Successfully",
      });
    } else {
      return res.send({ status: false, message: "Squad code not exits!" });
    }
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      message: e.message,
    });
  }
};

const JoinSquadByLink = async (req, res) => {
  try {
    const { UserID, SquadID } = req.params;
    /*
    return res.send({
      status: false,
      UserID: UserID,
      SquadID: SquadID,
    });
*/
    const isValidUserId = ObjectId.isValid(UserID);
    if (!isValidUserId) {
      return res.send({
        status: false,
        message: "Shared Link Is Not Correct",
      });
    }

    const getSharedUserDetails = await UserService.getUserBy({
      _id: new ObjectId(UserID),
    });
    console.log("getSharedUserDetails:=", getSharedUserDetails);
    if (!getSharedUserDetails) {
      return res.send({
        status: false,
        message: "Shared Link Is Not Correct",
      });
    }
    const getSquad = await SquadModel.findOne({
      SquadCode: SquadID,
    });
    console.log("getSquad:=", getSquad);
    if (!getSquad) {
      return res.send({
        status: false,
        message: "Shared Link Is Not Correct",
      });
    }
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });

    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    const getCurrentWeek = await WeekModel.findOne({ isActive: true });

    //if has own squad then IsLeftByOwner is true
    const updateSquad = await SquadModel.updateOne(
      { UserID: req.userDetails._id },
      { IsLeftByOwner: true }
    );

    const post = await UserService.updateUser(req.userDetails._id, {
      MySquadID: "",
      FriendSquadID: SquadID,
    });
    //check by same person refferal then no reward.

    //check if this week already take link by squad rewards then deduct rewards from previous and give no reward

    //transfer award to new squad
    const transferRewards = await LeaderboardModel.findOneAndUpdate(
      {
        WeekID: getCurrentWeek._id,
        UserID: req.userDetails._id,
      },
      {
        $set: {
          SQuadID: getSquad._id,
        },
        $setOnInsert: {
          TotalRewards: 0.0,
        },
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if no document matches the query
      }
    );

    return res.send({
      status: true,
      userDetails: post,
      SquadInfo: getSquad,
      message: "You Joined The Squad Successfully",
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      //ErrorMessage: e.message,
    });
  }
};

const LeaveSquad = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });

    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    if (
      !getUserDetails.FriendSquadID?.trim() &&
      !getUserDetails.MySquadID?.trim()
    ) {
      return res.send({
        status: false,
        message: "You don't join any squad yet!",
      });
    }
    const post = await UserService.updateUser(req.userDetails._id, {
      FriendSquadID: "",
      MySquadID: "",
    });
    const getCurrentWeek = await WeekModel.findOne({ isActive: true });
    //if has own squad then IsLeftByOwner is true
    const updateSquad = await SquadModel.updateOne(
      { UserID: req.userDetails._id },
      { IsLeftByOwner: true }
    );

    // Remove the SQuadID if the record exists
    const transferRewards = await LeaderboardModel.findOneAndUpdate(
      {
        WeekID: getCurrentWeek._id,
        UserID: req.userDetails._id,
      },
      {
        $unset: {
          SQuadID: "",
        },
      },
      {
        new: true, // Return the updated document
      }
    );

    return res.send({
      status: true,
      message: "You Left The Squad Successfully",
    });
  } catch {
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
/*
const getListOfSquad = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });

    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    // Fetch all squads
    const squads = await SquadModel.find();

    // Filter the squads based on the conditions
    const filteredSquads = squads.filter(
      (squad) =>
        !squad.UserID.equals(req.userDetails._id) ||
        (squad.UserID.equals(req.userDetails._id) &&
          squad.IsLeftByOwner === true)
    );
    return res.send({ status: true, AllSquads: filteredSquads });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      mesage: e.message,
    });
  }
};
*/
const getListOfSquad = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    if (!getUserDetails) {
      return res.send({ status: false, message: "something went wrong!" });
    }

    // Fetch all squads
    const squads = await SquadModel.find();

    // Filter the squads based on the conditions
    const filteredSquads = squads.filter(
      (squad) =>
        !squad.UserID.equals(req.userDetails._id) ||
        (squad.UserID.equals(req.userDetails._id) &&
          squad.IsLeftByOwner === true)
    );

    // Aggregate the total rewards for each squad
    const squadIds = filteredSquads.map((squad) => squad._id);
    const rewardsAggregation = await LeaderboardModel.aggregate([
      { $match: { SQuadID: { $in: squadIds } } },
      { $group: { _id: "$SQuadID", totalRewards: { $sum: "$TotalRewards" } } },
    ]);

    // Merge the total rewards into the filtered squads
    const squadsWithRewards = filteredSquads.map((squad) => {
      const reward = rewardsAggregation.find((r) => r._id.equals(squad._id));
      return {
        ...squad.toObject(),
        totalRewards: reward ? reward.totalRewards : 0,
      };
    });
    const user_current_squad = await SquadModel.findOne({
      SquadCode: getUserDetails.MySquadID,
    });
    return res.send({
      status: true,
      AllSquads: squadsWithRewards,
      user_current_squad,
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      error: e.message,
    });
  }
};

/*
const getSquadInfo = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    const SquadCode = req.body.SquadCode.trim();
    if (!getUserDetails) {
      return res.send({ status: false, message: "something went wrong!" });
    }

    // Fetch all squads
    const squads = await SquadModel.findOne({ SquadCode: SquadCode });
    if (squads) {
      return res.send({
        status: true,
        SquadsInfo: squads,
      });
    } else {
      return res.send({
        status: false,
        message: "Code is In-valid!",
      });
    }
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      //error: e.message,
    });
  }
};

*/

const getSquadInfo = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    const SquadCode = req.body.SquadCode.trim();
    if (!getUserDetails) {
      return res.send({ status: false, message: "something went wrong!" });
    }

    // Fetch squad details by SquadCode
    const squad = await SquadModel.findOne({ SquadCode: SquadCode });
    if (!squad) {
      return res.send({
        status: false,
        message: "Code is In-valid!",
      });
    }

    // Fetch leaderboard details for the squad
    const leaderboardData = await LeaderboardModel.aggregate([
      { $match: { SQuadID: squad._id } },
      {
        $group: {
          _id: "$SQuadID",
          TotalUsers: { $sum: 1 },
          TotalRewards: { $sum: "$TotalRewards" },
        },
      },
      {
        $lookup: {
          from: "squads",
          localField: "_id",
          foreignField: "_id",
          as: "SquadInfo",
        },
      },
      { $unwind: "$SquadInfo" },
      {
        $project: {
          _id: 1,
          TotalUsers: 1,
          TotalRewards: 1,
          "SquadInfo.SquadCode": 1,
          "SquadInfo.SquadName": 1,
          "SquadInfo.RankName": 1,
          "SquadInfo.RankNumber": 1,
        },
      },
    ]);

    if (leaderboardData.length > 0) {
      return res.send({
        status: true,
        SquadsInfo: leaderboardData[0],
      });
    } else {
      return res.send({
        status: false,
        message: "No data found for the given Squad Code!",
      });
    }
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      //error: e.message,
    });
  }
};

module.exports = {
  createSquad,
  JoinSquadByCode,
  JoinSquadByLink,
  LeaveSquad,
  getListOfSquad,
  getSquadInfo,
};
