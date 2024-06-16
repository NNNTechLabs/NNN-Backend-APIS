const User = require("../models/User");
const ObjectId = require("mongodb").ObjectId;

const getUserName = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};
const getAllUsers = async () => {
  const posts = await User.find();
  return posts;
};

const getUserById = async (userID) => {
  try {
    const post = await User.findOne({ _id: userID });
    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getUserBy = async (payload) => {
  try {
    const post = await User.findOne(payload);
    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getUsersBy = async (payload) => {
  try {
    const post = await User.find(payload);
    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getUserByWallet = async (walletAddress) => {
  try {
    const post = await User.findOne({ walletAddress: walletAddress });
    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};
const checkReferralCode = async (ReferralCode) => {
  try {
    const post = await User.findOne({
      MyReferralCode: ReferralCode,
    });
    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const addUser = async (payload) => {
  try {
    if (!payload.walletAddress) return null;

    const post = new User({
      walletAddress: payload.walletAddress,
      telegram_id: payload.telegram_id,
      telegram_username: payload.telegram_username,
      ReferrerCode: payload.ReferrerCode,
      MyReferralCode: payload.MyReferralCode,
      userAvatar: payload.userAvatar,
      userName: payload.userName !== "" ? payload.userName : getUserName(6),
      jwt_token: payload.token,
      KOLAccount: payload.KOLAccount,
      Energy: 0,
      Tier: 0,
      signed: true,
      DayCounter: 0,
      //rewardCoins: payload.RefereeReward,
    });
    await post.save();
    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const updateUser = async (userID, payload, files = null) => {
  try {
    await User.updateOne({ _id: userID }, { ...payload, updated: Date.now() });
    return User.findOne({ _id: userID });
  } catch (error) {
    console.log(error);
    return null;
  }
};

const deleteUser = async (userId) => {
  try {
    const post = await User.findOne({ _id: userId });
    post.deleted = true;
    await post.save();
    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const updateUserRewards = async (userID, rewardsToAdd) => {
  try {
    await User.updateOne(
      { _id: new ObjectId(userID) },
      { $inc: { rewardCoins: rewardsToAdd } }
    );
    return User.findOne({ _id: userID });
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = {
  getAllUsers,
  getUserByWallet,
  getUserBy,
  getUsersBy,
  getUserById,
  addUser,
  updateUser,
  deleteUser,
  updateUserRewards,
  checkReferralCode,
};
