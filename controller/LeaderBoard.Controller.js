var jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserService = require("../service/user");
const config = require("../config/Config");
const ObjectId = require("mongoose").Types.ObjectId;
const WeekModel = require("../models/weeks");
const SquadModel = require("../models/Squad");
const LeaderboardModel = require("../models/Leaderboard");
const { notEqual } = require("assert");

const getindividualLeaderBoardData = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    const PageNo = req.body.PageNo ? req.body.PageNo : 1;
    const pageLimit = 50;
    const skip = (PageNo - 1) * pageLimit;
    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    const currentWeek = await WeekModel.findOne({ isActive: true });
    let currentWeekLeaderboard = [];
    let currentWeekCount = 0;
    // Fetch leaderboard data for the current week
    if (currentWeek) {
      currentWeekCount = await LeaderboardModel.countDocuments({
        WeekID: currentWeek._id,
      });

      currentWeekLeaderboard = await LeaderboardModel.find({
        WeekID: currentWeek._id,
      })
        .populate("UserID")
        .sort({ TotalRewards: -1 })
        .skip(skip)
        .limit(pageLimit);
    }
    // Fetch previous week
    const previousWeek = await WeekModel.findOne({
      endDate: { $lt: currentWeek?.startDate },
    }).sort({ endDate: -1 });

    // Fetch leaderboard data for the previous week
    let pastWeeksLeaderboard = [];
    let pastWeekTotalPages = 0;
    if (previousWeek) {
      const pastWeekCount = await LeaderboardModel.countDocuments({
        WeekID: previousWeek._id,
      });
      pastWeeksLeaderboard = await LeaderboardModel.find({
        WeekID: previousWeek._id,
      })
        .populate("UserID")
        .sort({ TotalRewards: -1 })
        .skip(skip)
        .limit(pageLimit);
      pastWeekTotalPages = Math.ceil(pastWeekCount / pageLimit);
    }
    // Fetch all-time leaderboard data
    // Fetch total count and all-time leaderboard data
    const allTimeCount = await LeaderboardModel.countDocuments();
    const allTimeLeaderboard = await LeaderboardModel.aggregate([
      { $group: { _id: "$UserID", TotalRewards: { $sum: "$TotalRewards" } } },
      { $sort: { TotalRewards: -1 } },
      { $skip: skip },
      { $limit: pageLimit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: "$User" },
    ]);
    const allTimeTotalPages = Math.ceil(allTimeCount / pageLimit);

    return res.send({
      status: true,
      currentWeekLeaderboard,
      currentWeekCount,
      pastWeeksLeaderboard,
      pastWeekTotalPages,
      allTimeLeaderboard,
      allTimeTotalPages,
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      //ErrorMessage: e.message,
    });
  }
};

const getindividualCurrentLeaderBoardData = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    const PageNo = req.body.PageNo ? req.body.PageNo : 1;
    const pageLimit = 50;
    const skip = (PageNo - 1) * pageLimit;
    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    const currentWeek = await WeekModel.findOne({ isActive: true });
    let currentWeekLeaderboard = [];
    let currentWeekTotalPages = 0;
    // Fetch leaderboard data for the current week
    if (currentWeek) {
      currentWeekCount = await LeaderboardModel.countDocuments({
        WeekID: currentWeek._id,
      });

      currentWeekLeaderboard = await LeaderboardModel.find({
        WeekID: currentWeek._id,
      })
        .populate({
          path: "UserID",
          select: "Energy userAvatar userName rewardCoins KOLAccount", // Replace with actual field names
        })
        .sort({ TotalRewards: -1 })
        .skip(skip)
        .limit(pageLimit);
      currentWeekTotalPages = Math.ceil(currentWeekCount / pageLimit);
    }

    return res.send({
      status: true,
      List: currentWeekLeaderboard,
      Totalpage: currentWeekTotalPages,
      CurrentPage: PageNo,
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      //ErrorMessage: e.message,
    });
  }
};
const getindividualPreviousLeaderBoardData = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    const PageNo = req.body.PageNo ? req.body.PageNo : 1;
    const pageLimit = 50;
    const skip = (PageNo - 1) * pageLimit;
    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    const currentWeek = await WeekModel.findOne({ isActive: true });
    // Fetch previous week
    const previousWeek = await WeekModel.findOne({
      endDate: { $lt: currentWeek?.startDate },
    }).sort({ endDate: -1 });

    // Fetch leaderboard data for the previous week
    let pastWeeksLeaderboard = [];
    let pastWeekTotalPages = 0;
    if (previousWeek) {
      const pastWeekCount = await LeaderboardModel.countDocuments({
        WeekID: previousWeek._id,
      });
      pastWeeksLeaderboard = await LeaderboardModel.find({
        WeekID: previousWeek._id,
      })
        .populate({
          path: "UserID",
          select: "Energy userAvatar userName rewardCoins KOLAccount", // Replace with actual field names
        })
        .sort({ TotalRewards: -1 })
        .skip(skip)
        .limit(pageLimit);
      pastWeekTotalPages = Math.ceil(pastWeekCount / pageLimit);
    }

    return res.send({
      status: true,
      List: pastWeeksLeaderboard,
      Totalpage: pastWeekTotalPages,
      CurrentPage: PageNo,
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      //ErrorMessage: e.message,
    });
  }
};
const getindividualAllTimeLeaderBoardData = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    const PageNo = req.body.PageNo ? req.body.PageNo : 1;
    const pageLimit = 50;
    const skip = (PageNo - 1) * pageLimit;
    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    // Fetch all-time leaderboard data
    // Fetch total count and all-time leaderboard data
    const allTimeCount = await LeaderboardModel.countDocuments();
    const allTimeLeaderboard = await LeaderboardModel.aggregate([
      { $group: { _id: "$UserID", TotalRewards: { $sum: "$TotalRewards" } } },
      { $sort: { TotalRewards: -1 } },
      { $skip: skip },
      { $limit: pageLimit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "UserID",
        },
      },
      { $unwind: "$UserID" },
      {
        $project: {
          _id: 1,
          TotalRewards: 1,
          "UserID.Energy": 1,
          "UserID.userAvatar": 1,
          "UserID.userName": 1,
          "UserID.rewardCoins": 1,
          "UserID.KOLAccount": 1,
        },
      },
    ]);
    const allTimeTotalPages = Math.ceil(allTimeCount / pageLimit);

    return res.send({
      status: true,
      List: allTimeLeaderboard,
      Totalpage: allTimeTotalPages,
      CurrentPage: PageNo,
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      //ErrorMessage: e.message,
    });
  }
};
const getDatabySquad = async (req, res) => {
  try {
    const PageNo = req.body.PageNo ? req.body.PageNo : 1;
    const pageLimit = 50;
    const skip = (PageNo - 1) * pageLimit;

    const currentWeek = await WeekModel.findOne({ isActive: true });
    let currentWeekLeaderboard = [];
    let currentWeekCount = 0;

    // Fetch leaderboard data for the current week for all squads
    if (currentWeek) {
      currentWeekCount = await LeaderboardModel.countDocuments({
        WeekID: currentWeek._id,
        SQuadID: { $ne: null },
      });

      currentWeekLeaderboard = await LeaderboardModel.aggregate([
        { $match: { WeekID: currentWeek._id, SQuadID: { $ne: null } } },
        {
          $lookup: {
            from: "squads",
            localField: "SQuadID",
            foreignField: "_id",
            as: "Squad",
          },
        },
        { $unwind: "$Squad" },
        {
          $lookup: {
            from: "users",
            localField: "UserID",
            foreignField: "_id",
            as: "User",
          },
        },
        { $unwind: "$User" },
        { $sort: { TotalRewards: -1 } },
        { $skip: skip },
        { $limit: pageLimit },
      ]);
    }

    // Fetch previous week
    const previousWeek = await WeekModel.findOne({
      endDate: { $lt: currentWeek?.startDate },
    }).sort({ endDate: -1 });

    // Fetch leaderboard data for the previous week for all squads
    let pastWeeksLeaderboard = [];
    let pastWeekTotalPages = 0;
    if (previousWeek) {
      const pastWeekCount = await LeaderboardModel.countDocuments({
        WeekID: previousWeek._id,
        SQuadID: { $ne: null },
      });
      pastWeeksLeaderboard = await LeaderboardModel.aggregate([
        { $match: { WeekID: previousWeek._id, SQuadID: { $ne: null } } },
        {
          $lookup: {
            from: "squads",
            localField: "SQuadID",
            foreignField: "_id",
            as: "Squad",
          },
        },
        { $unwind: "$Squad" },
        {
          $lookup: {
            from: "users",
            localField: "UserID",
            foreignField: "_id",
            as: "User",
          },
        },
        { $unwind: "$User" },
        { $sort: { TotalRewards: -1 } },
        { $skip: skip },
        { $limit: pageLimit },
      ]);
      pastWeekTotalPages = Math.ceil(pastWeekCount / pageLimit);
    }

    // Fetch all-time leaderboard data for all squads
    const allTimeCount = await LeaderboardModel.countDocuments({
      SQuadID: { $ne: null },
    });
    const allTimeLeaderboard = await LeaderboardModel.aggregate([
      { $match: { SQuadID: { $ne: null } } },
      {
        $group: {
          _id: { SQuadID: "$SQuadID", UserID: "$UserID" },
          TotalRewards: { $sum: "$TotalRewards" },
        },
      },
      {
        $lookup: {
          from: "squads",
          localField: "_id.SQuadID",
          foreignField: "_id",
          as: "Squad",
        },
      },
      { $unwind: "$Squad" },
      {
        $lookup: {
          from: "users",
          localField: "_id.UserID",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: "$User" },
      { $sort: { TotalRewards: -1 } },
      { $skip: skip },
      { $limit: pageLimit },
    ]);
    const allTimeTotalPages = Math.ceil(allTimeCount / pageLimit);

    return res.send({
      status: true,
      currentWeekLeaderboard,
      currentWeekCount,
      pastWeeksLeaderboard,
      pastWeekTotalPages,
      allTimeLeaderboard,
      allTimeTotalPages,
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      // ErrorMessage: e.message,
    });
  }
};
const getSquadCurrentLeaderBoardData = async (req, res) => {
  try {
    const PageNo = req.body.PageNo ? req.body.PageNo : 1;
    const pageLimit = 50;
    const skip = (PageNo - 1) * pageLimit;

    const currentWeek = await WeekModel.findOne({ isActive: true });
    let currentWeekLeaderboard = [];
    let currentWeekCount = 0;

    // Fetch leaderboard data for the current week for all squads
    if (currentWeek) {
      currentWeekCount = await LeaderboardModel.countDocuments({
        WeekID: currentWeek._id,
        SQuadID: { $ne: null },
      });

      currentWeekLeaderboard = await LeaderboardModel.aggregate([
        { $match: { WeekID: currentWeek._id, SQuadID: { $ne: null } } },
        {
          $lookup: {
            from: "squads",
            localField: "SQuadID",
            foreignField: "_id",
            as: "Squad",
          },
        },
        { $unwind: "$Squad" },
        {
          $lookup: {
            from: "users",
            localField: "UserID",
            foreignField: "_id",
            as: "User",
          },
        },
        { $unwind: "$User" },
        { $sort: { TotalRewards: -1 } },
        { $skip: skip },
        { $limit: pageLimit },
      ]);
    }

    // Fetch previous week
    const previousWeek = await WeekModel.findOne({
      endDate: { $lt: currentWeek?.startDate },
    }).sort({ endDate: -1 });

    // Fetch leaderboard data for the previous week for all squads
    let pastWeeksLeaderboard = [];
    let pastWeekTotalPages = 0;
    if (previousWeek) {
      const pastWeekCount = await LeaderboardModel.countDocuments({
        WeekID: previousWeek._id,
        SQuadID: { $ne: null },
      });
      pastWeeksLeaderboard = await LeaderboardModel.aggregate([
        { $match: { WeekID: previousWeek._id, SQuadID: { $ne: null } } },
        {
          $lookup: {
            from: "squads",
            localField: "SQuadID",
            foreignField: "_id",
            as: "Squad",
          },
        },
        { $unwind: "$Squad" },
        {
          $lookup: {
            from: "users",
            localField: "UserID",
            foreignField: "_id",
            as: "User",
          },
        },
        { $unwind: "$User" },
        { $sort: { TotalRewards: -1 } },
        { $skip: skip },
        { $limit: pageLimit },
      ]);
      pastWeekTotalPages = Math.ceil(pastWeekCount / pageLimit);
    }

    // Fetch all-time leaderboard data for all squads
    const allTimeCount = await LeaderboardModel.countDocuments({
      SQuadID: { $ne: null },
    });
    const allTimeLeaderboard = await LeaderboardModel.aggregate([
      { $match: { SQuadID: { $ne: null } } },
      {
        $group: {
          _id: { SQuadID: "$SQuadID", UserID: "$UserID" },
          TotalRewards: { $sum: "$TotalRewards" },
        },
      },
      {
        $lookup: {
          from: "squads",
          localField: "_id.SQuadID",
          foreignField: "_id",
          as: "Squad",
        },
      },
      { $unwind: "$Squad" },
      {
        $lookup: {
          from: "users",
          localField: "_id.UserID",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: "$User" },
      { $sort: { TotalRewards: -1 } },
      { $skip: skip },
      { $limit: pageLimit },
    ]);
    const allTimeTotalPages = Math.ceil(allTimeCount / pageLimit);

    return res.send({
      status: true,
      currentWeekLeaderboard,
      currentWeekCount,
      pastWeeksLeaderboard,
      pastWeekTotalPages,
      allTimeLeaderboard,
      allTimeTotalPages,
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      // ErrorMessage: e.message,
    });
  }
};
const getSquadPreviousLeaderBoardData = async (req, res) => {
  try {
    const PageNo = req.body.PageNo ? req.body.PageNo : 1;
    const pageLimit = 50;
    const skip = (PageNo - 1) * pageLimit;

    const currentWeek = await WeekModel.findOne({ isActive: true });
    let currentWeekLeaderboard = [];
    let currentWeekCount = 0;

    // Fetch leaderboard data for the current week for all squads
    if (currentWeek) {
      currentWeekCount = await LeaderboardModel.countDocuments({
        WeekID: currentWeek._id,
        SQuadID: { $ne: null },
      });

      currentWeekLeaderboard = await LeaderboardModel.aggregate([
        { $match: { WeekID: currentWeek._id, SQuadID: { $ne: null } } },
        {
          $lookup: {
            from: "squads",
            localField: "SQuadID",
            foreignField: "_id",
            as: "Squad",
          },
        },
        { $unwind: "$Squad" },
        {
          $lookup: {
            from: "users",
            localField: "UserID",
            foreignField: "_id",
            as: "User",
          },
        },
        { $unwind: "$User" },
        { $sort: { TotalRewards: -1 } },
        { $skip: skip },
        { $limit: pageLimit },
      ]);
    }

    // Fetch previous week
    const previousWeek = await WeekModel.findOne({
      endDate: { $lt: currentWeek?.startDate },
    }).sort({ endDate: -1 });

    // Fetch leaderboard data for the previous week for all squads
    let pastWeeksLeaderboard = [];
    let pastWeekTotalPages = 0;
    if (previousWeek) {
      const pastWeekCount = await LeaderboardModel.countDocuments({
        WeekID: previousWeek._id,
        SQuadID: { $ne: null },
      });
      pastWeeksLeaderboard = await LeaderboardModel.aggregate([
        { $match: { WeekID: previousWeek._id, SQuadID: { $ne: null } } },
        {
          $lookup: {
            from: "squads",
            localField: "SQuadID",
            foreignField: "_id",
            as: "Squad",
          },
        },
        { $unwind: "$Squad" },
        {
          $lookup: {
            from: "users",
            localField: "UserID",
            foreignField: "_id",
            as: "User",
          },
        },
        { $unwind: "$User" },
        { $sort: { TotalRewards: -1 } },
        { $skip: skip },
        { $limit: pageLimit },
      ]);
      pastWeekTotalPages = Math.ceil(pastWeekCount / pageLimit);
    }

    // Fetch all-time leaderboard data for all squads
    const allTimeCount = await LeaderboardModel.countDocuments({
      SQuadID: { $ne: null },
    });
    const allTimeLeaderboard = await LeaderboardModel.aggregate([
      { $match: { SQuadID: { $ne: null } } },
      {
        $group: {
          _id: { SQuadID: "$SQuadID", UserID: "$UserID" },
          TotalRewards: { $sum: "$TotalRewards" },
        },
      },
      {
        $lookup: {
          from: "squads",
          localField: "_id.SQuadID",
          foreignField: "_id",
          as: "Squad",
        },
      },
      { $unwind: "$Squad" },
      {
        $lookup: {
          from: "users",
          localField: "_id.UserID",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: "$User" },
      { $sort: { TotalRewards: -1 } },
      { $skip: skip },
      { $limit: pageLimit },
    ]);
    const allTimeTotalPages = Math.ceil(allTimeCount / pageLimit);

    return res.send({
      status: true,
      currentWeekLeaderboard,
      currentWeekCount,
      pastWeeksLeaderboard,
      pastWeekTotalPages,
      allTimeLeaderboard,
      allTimeTotalPages,
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      // ErrorMessage: e.message,
    });
  }
};
const getSquadAllTimeLeaderBoardData = async (req, res) => {
  try {
    const PageNo = req.body.PageNo ? req.body.PageNo : 1;
    const pageLimit = 50;
    const skip = (PageNo - 1) * pageLimit;

    const currentWeek = await WeekModel.findOne({ isActive: true });
    let currentWeekLeaderboard = [];
    let currentWeekCount = 0;

    // Fetch leaderboard data for the current week for all squads
    if (currentWeek) {
      currentWeekCount = await LeaderboardModel.countDocuments({
        WeekID: currentWeek._id,
        SQuadID: { $ne: null },
      });

      currentWeekLeaderboard = await LeaderboardModel.aggregate([
        { $match: { WeekID: currentWeek._id, SQuadID: { $ne: null } } },
        {
          $lookup: {
            from: "squads",
            localField: "SQuadID",
            foreignField: "_id",
            as: "Squad",
          },
        },
        { $unwind: "$Squad" },
        {
          $lookup: {
            from: "users",
            localField: "UserID",
            foreignField: "_id",
            as: "User",
          },
        },
        { $unwind: "$User" },
        { $sort: { TotalRewards: -1 } },
        { $skip: skip },
        { $limit: pageLimit },
      ]);
    }

    // Fetch previous week
    const previousWeek = await WeekModel.findOne({
      endDate: { $lt: currentWeek?.startDate },
    }).sort({ endDate: -1 });

    // Fetch leaderboard data for the previous week for all squads
    let pastWeeksLeaderboard = [];
    let pastWeekTotalPages = 0;
    if (previousWeek) {
      const pastWeekCount = await LeaderboardModel.countDocuments({
        WeekID: previousWeek._id,
        SQuadID: { $ne: null },
      });
      pastWeeksLeaderboard = await LeaderboardModel.aggregate([
        { $match: { WeekID: previousWeek._id, SQuadID: { $ne: null } } },
        {
          $lookup: {
            from: "squads",
            localField: "SQuadID",
            foreignField: "_id",
            as: "Squad",
          },
        },
        { $unwind: "$Squad" },
        {
          $lookup: {
            from: "users",
            localField: "UserID",
            foreignField: "_id",
            as: "User",
          },
        },
        { $unwind: "$User" },
        { $sort: { TotalRewards: -1 } },
        { $skip: skip },
        { $limit: pageLimit },
      ]);
      pastWeekTotalPages = Math.ceil(pastWeekCount / pageLimit);
    }

    // Fetch all-time leaderboard data for all squads
    const allTimeCount = await LeaderboardModel.countDocuments({
      SQuadID: { $ne: null },
    });
    const allTimeLeaderboard = await LeaderboardModel.aggregate([
      { $match: { SQuadID: { $ne: null } } },
      {
        $group: {
          _id: { SQuadID: "$SQuadID", UserID: "$UserID" },
          TotalRewards: { $sum: "$TotalRewards" },
        },
      },
      {
        $lookup: {
          from: "squads",
          localField: "_id.SQuadID",
          foreignField: "_id",
          as: "Squad",
        },
      },
      { $unwind: "$Squad" },
      {
        $lookup: {
          from: "users",
          localField: "_id.UserID",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: "$User" },
      { $sort: { TotalRewards: -1 } },
      { $skip: skip },
      { $limit: pageLimit },
    ]);
    const allTimeTotalPages = Math.ceil(allTimeCount / pageLimit);

    return res.send({
      status: true,
      currentWeekLeaderboard,
      currentWeekCount,
      pastWeeksLeaderboard,
      pastWeekTotalPages,
      allTimeLeaderboard,
      allTimeTotalPages,
    });
  } catch (e) {
    return res.send({
      status: false,
      message: "Something went wrong!",
      // ErrorMessage: e.message,
    });
  }
};

module.exports = {
  getindividualLeaderBoardData,
  getindividualCurrentLeaderBoardData,
  getindividualPreviousLeaderBoardData,
  getindividualAllTimeLeaderBoardData,
  getDatabySquad,
  getSquadCurrentLeaderBoardData,
  getSquadPreviousLeaderBoardData,
  getSquadAllTimeLeaderBoardData,
};
