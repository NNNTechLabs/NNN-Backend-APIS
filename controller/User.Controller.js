var jwt = require("jsonwebtoken");
const csv = require("fast-csv");
const crypto = require("crypto");
var { TwitterApi } = require("twitter-api-v2");
const DiscordOauth2 = require("discord-oauth2");
const UserService = require("../service/user");
const config = require("../config/Config");
const KOLWalletMdl = require("../models/KOLWalletAddress");
const RewardService = require("../service/Rewards");
const oauth = new DiscordOauth2();
const ObjectId = require("mongoose").Types.ObjectId;
const client = new TwitterApi({
  clientId: config.Twitter_CLIENT_ID,
  clientSecret: config.Twitter_CLIENT_SECRET,
});

// Helper function to generate a random alphanumeric string prefixed with "NNN" and converted to uppercase
function generateRandomString(length) {
  const randomString = crypto
    .randomBytes(length)
    .toString("hex")
    .slice(0, length)
    .toUpperCase();
  return `NNN${randomString}`;
}

// Helper function to generate a random alphanumeric string prefixed with "SQA" and converted to uppercase
function generateSquadRandomString(length) {
  const randomString = crypto
    .randomBytes(length)
    .toString("hex")
    .slice(0, length)
    .toUpperCase();
  return `SQA${randomString}`;
}
const checkIsKOLAccount = async (walletAddress) => {
  const checkAddress = await KOLWalletMdl.findOne({
    WalletAddress: walletAddress,
  });
  return !!checkAddress;
};

const importKolAddresses = async (req, res) => {
  var fs = require("fs");
  const filePath = req.file.path;
  let fileRows = [];
  let prePresentCodes = [];
  let counter = 0;

  csv
    .parseFile(filePath)
    .on("data", function (data) {
      let walletAddress = data[0].trim();

      if (counter != 0) {
        fileRows.push({
          walletAddress,
        });
      }
      counter++;
    })
    .on("end", async function () {
      fs.unlinkSync(filePath);
      const processingResults = await Promise.all(
        fileRows.map(async ({ walletAddress }) => {
          let post = await KOLWalletMdl.findOne({
            WalletAddress: walletAddress,
          });
          if (post) {
            prePresentCodes.push(walletAddress);
          } else {
            const newPost = new KOLWalletMdl({
              WalletAddress: walletAddress,
            });
            await newPost.save();
          }
          const userDetail = await UserService.getUserByWallet(walletAddress);

          if (userDetail) {
            const post = await UserService.updateUser(userDetail._id, {
              KOLAccount: true,
            });
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

const getAllUsers = async (req, res) => {
  const posts = await UserService.getAllUsers();
  return res.send({ status: true, data: posts });
};
const loginWithWallet = async (req, res) => {
  const userDetail = await UserService.getUserByWallet(req.body.walletAddress);
  const userAvatar = req.body.PictureURL?.trim();
  if (!userDetail) {
    return res.send({
      status: false,
      message: "User Not Found!",
    });
  } else {
    var token = jwt.sign({ data: req.body.walletAddress }, config.jwt_secret, {
      expiresIn: config.jwt_expire,
    });
    let User = await UserService.updateUser(userDetail._id, {
      userAvatar: userAvatar,
      jwt_token: token,
    });

    /*
    if (User && User.signed) {
      // Fetch referral codes if the user update was signed
      const referralCodes = await ReferralcodeModel.find({
        userId: ObjectId(User._id),
        Tier: { $lte: User.Tier },
      });

      if (referralCodes) {
        let userData = User.toObject ? User.toObject() : User;
        userData.Referralcodes = referralCodes;
        User = userData;
      }
    } else {
      return res.send({
        status: true,
        data: User,
      });
    }
    */

    return res.send({
      status: true,
      data: User,
    });
  }
};

const signup = async (req, res) => {
  //const { walletAddress, telegram_id, telegram_username, ReferralCode, username } = req.body;
  const WalletAddress = req.body.walletAddress?.trim();
  const TelegramID = req.body.telegram_id;
  const TelegramUsername = req.body.telegram_username;
  const ReferralCode = req.body.ReferralCode?.trim();
  const username = req.body.username?.trim();
  const userAvatar = req.body.PictureURL?.trim();

  const TelegramAuthenticationReward = config.TelegramAuthenticationReward;
  // Validate required fields
  /*
  if (!WalletAddress || !TelegramID || !TelegramUsername) {
    return res.status(400).send({
      status: false,
      message:
        "walletAddress, telegram id, and telegram username are required.",
    });
  }
*/
  const userDetail = await UserService.getUserByWallet(WalletAddress);

  if (!userDetail) {
    var token = jwt.sign({ data: WalletAddress }, config.jwt_secret, {
      expiresIn: config.jwt_expire,
    });
    const MyReferralCode = generateRandomString(7);
    const isKOLAccount = await checkIsKOLAccount(WalletAddress);
    const newUser = {
      walletAddress: WalletAddress,
      ReferrerCode: ReferralCode,
      MyReferralCode: MyReferralCode,
      userName: username,
      KOLAccount: isKOLAccount,
      token: token,
      telegram_id: TelegramID,
      telegram_username: TelegramUsername,
      userAvatar: userAvatar,
      //RefereeReward: RefereeReward,
    };
    const userData = await UserService.addUser(newUser);

    let RefereeReward = 0;
    if (ReferralCode != "") {
      const checkReferralCodeData = await UserService.checkReferralCode(
        ReferralCode
      );
      if (checkReferralCodeData) {
        const ReferrerReward = await RewardService.addRewards(
          checkReferralCodeData.id,
          config.ReferrerReward
        );
        const addRefereeReward = await RewardService.addRewards(
          userData.id,
          config.RefereeReward
        );
      }
    }
    const addTelegramAuthReward = await RewardService.addRewards(
      userData.id,
      config.TelegramAuthenticationReward
    );
    const getUserDetails = await UserService.getUserBy({
      _id: userData._id,
    });
    return res.send({
      status: true,
      UserDetails: getUserDetails,
      authtoken: token,
    });
  } else {
    return res.send({
      status: false,
      message: "Wallet Address Already Exists!",
    });
  }
};

const authWithTitter = async (req, res) => {
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    config.Twitter_redirect,
    {
      scope: ["tweet.read", "users.read", "offline.access"],
      state: req.body.walletAddress || "none",
    }
  );
  return res.send({ status: true, data: { url, codeVerifier } });
};

const loginWithTwitter = async (req, res) => {
  try {
    const { code, address, codeVerifier } = req.body;
    if (!codeVerifier || !code) {
      return res
        .status(400)
        .send("You denied the app or your session expired!");
    }
    let {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: config.Twitter_redirect,
    });
    const { data: twitterInfo } = await loggedClient.v2.me();
    // console.log("Twitter authorized", twitterInfo, address);

    const userDetail = await UserService.getUserBy({
      twitter_id: twitterInfo.id,
    });
    if (userDetail) {
      return res.send({
        status: false,
        message: "Twitter already linked with an existing user",
      });
    } else {
      if (address == "")
        return res.send({ status: false, message: "wallet Address needed" });

      const newbieDetail = await UserService.getUserByWallet(address);
      if (newbieDetail) {
        let token = jwt.sign(
          { data: newbieDetail.walletAddress },
          config.jwt_secret,
          { expiresIn: config.jwt_expire }
        );
        let post = await UserService.updateUser(newbieDetail._id, {
          jwt_token: token,
          twitter_id: twitterInfo.id,
          twitter_name: twitterInfo.username,
          signed: true,
        });

        if (post) {
          return res.send({ status: true, data: post, jwt_token: token });
        } else
          return res.send({ status: false, message: "something went wrong!" });
      } else
        return res.send({
          status: false,
          message: "please wallet connect for the first!",
        });
    }
  } catch (error) {
    console.log(error);
    return res.send({ status: false });
  }
};

const authWithDiscord = async (req, res) => {
  const url = oauth.generateAuthUrl({
    scope: "identify",
    clientId: config.Discord_CLIENT_ID,
    responseType: "code",
    redirectUri: config.Discord_redirect,
    state: req.body.walletAddress || "none",
  });
  return res.send({ status: true, redirectUrl: url });
};

const loginWithDiscord = async (req, res) => {
  try {
    if (!req.body.code) throw new Error("NoCodeProvided");

    const code = req.body.code;
    const walletAddress = req.body.wallet_Address;
    console.log("walletAddress:=", walletAddress);
    const response = await oauth.tokenRequest({
      clientId: config.Discord_CLIENT_ID,
      clientSecret: config.Discord_CLIENT_SECRET,

      code: code,
      scope: "identify guilds",
      grantType: "authorization_code",

      redirectUri: config.Discord_redirect,
    });

    let discordInfo = await oauth.getUser(response.access_token);
    const userDetail = await UserService.getUserBy({
      discord_name: discordInfo.username,
      discord_discriminator: discordInfo.discriminator,
    });
    if (userDetail) {
      return res.send({
        status: false,
        message: "Discord already linked with an existing user",
      });
    } else {
      if (walletAddress === "")
        return res.send({ status: false, message: "wallet Address needed" });

      const newbieDetail = await UserService.getUserByWallet(walletAddress);

      if (newbieDetail) {
        let token = jwt.sign(
          { data: newbieDetail.walletAddress },
          config.jwt_secret,
          { expiresIn: config.jwt_expire }
        );
        let post = await UserService.updateUser(newbieDetail._id, {
          jwt_token: token,
          discord_name: discordInfo.username,
          discord_discriminator: discordInfo.discriminator,
          signed: true,
        });

        if (post) {
          return res.send({ status: true, user: post, jwt_token: token });
        } else
          return res.send({ status: false, message: "something went wrong!" });
      } else
        return res.send({
          status: false,
          message: "please wallet connect for the first!",
        });
    }
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "something went wrong!" });
  }
};

const getUserByWallet = async (req, res) => {
  try {
    const post = await UserService.getUserByWallet(req.params.walletaddress);
    if (post) return res.send({ status: true, data: post });
    else return res.send({ status: false, data: null });
  } catch {
    return res.send({ status: false, data: null });
  }
};
const updateUser = async (req, res) => {
  try {
    const post = await UserService.updateUser(req.userDetails._id, {
      userName: req.body.userName,
    });

    if (!post)
      return res.send({ status: false, message: "something went wrong!" });
    return res.send({ status: true, data: post });
  } catch {
    return res.send({ status: false, data: null });
  }
};
const createSquad = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });

    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });
    if (getUserDetails.MySquadID && getUserDetails.MySquadID.trim()) {
      return res.send({
        status: false,
        message: "Squad Code already generated!",
      });
    }
    const MySquadID = generateSquadRandomString(7);
    const post = await UserService.updateUser(req.userDetails._id, {
      MySquadID: MySquadID,
    });
    return res.send({ status: true, userDetail: post });
  } catch {
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const JoinSquad = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });

    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    if (getUserDetails.MySquadID == req.body.SquadID.trim()) {
      return res.send({
        status: false,
        message: "Can't join own Squad by yourself!",
      });
    }
    const getSquadUser = await UserService.getUserBy({
      MySquadID: req.body.SquadID.trim(),
    });
    if (getSquadUser) {
      const post = await UserService.updateUser(req.userDetails._id, {
        FriendSquadID: req.body.SquadID.trim(),
      });
      return res.send({ status: true, userDetail: post });
    } else {
      return res.send({ status: false, message: "Squad Id is wrong!" });
    }
  } catch {
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const LeaveSquad = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });

    if (!getUserDetails)
      return res.send({ status: false, message: "something went wrong!" });

    if (!getUserDetails.FriendSquadID && !getUserDetails.FriendSquadID.trim()) {
      return res.send({
        status: false,
        message: "You dont Join any Squad Yet!",
      });
    }
    const post = await UserService.updateUser(req.userDetails._id, {
      FriendSquadID: "",
    });
    return res.send({ status: true, userDetail: post });
  } catch {
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const DailyCheckin = async (req, res) => {
  try {
    let userDetail = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    if (!userDetail)
      return res.send({ status: false, message: "something went wrong!" });

    const currentDate = new Date();
    if (userDetail.LastClaim) {
      let TotalDayCounter = Number(userDetail.TotalDayCounter);
      let DayCounter = Number(userDetail.DayCounter);
      let DailycheckInRewardInc = Number(config.DailycheckInRewardInc);

      //let intermediateResult = TotalDayCounter * DayCounter;
      let TodayRewards = TotalDayCounter + DailycheckInRewardInc;
      const lastClaimDate = new Date(userDetail.LastClaim);
      const hoursDifference = Math.abs(currentDate - lastClaimDate) / 36e5; // Difference in hours
      if (hoursDifference < 24) {
        //if (isSameDay(lastClaimDate, currentDate)) {
        return res.send({
          status: false,
          message: "You have already collected your reward today!",
        });
      } else {
        userDetail.TotalDayCounter += 1;
        if (userDetail.DayCounter >= 6) {
          userDetail.DayCounter = 0;
        } else {
          userDetail.DayCounter += 1;
        }

        const post = await UserService.updateUser(req.userDetails._id, {
          LastClaim: currentDate,
          TotalDayCounter: userDetail.TotalDayCounter,
          DayCounter: userDetail.DayCounter,
        });
        const addDailyCheckingReward = await RewardService.addRewards(
          req.userDetails.id,
          TodayRewards
        );
        const updatedUser = await UserService.getUserBy({
          _id: req.userDetails._id,
        });
        return res.send({
          status: true,
          data: updatedUser,
          message: "congrats you have successfully claim daily reward",
        });
      }
    } else {
      const post = await UserService.updateUser(req.userDetails._id, {
        LastClaim: currentDate,
        DayCounter: 1,
        TotalDayCounter: 1,
      });

      const addDailyCheckingReward = await RewardService.addRewards(
        req.userDetails.id,
        config.DailycheckInRewardInc
      );
      const updatedUser = await UserService.getUserBy({
        _id: req.userDetails._id,
      });

      return res.send({
        status: true,
        data: updatedUser,
        message: "congrats you have successfully claim daily reward",
      });
    }
  } catch {
    return res.send({ status: false, data: null });
  }
};

const getCheckinDetails = async (req, res) => {
  try {
    const userDetail = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    if (!userDetail)
      return res.send({ status: false, message: "something went wrong!" });

    const currentDate = new Date();
    if (userDetail.LastClaim) {
      let intermediateResult =
        userDetail.TotalDayCounter * userDetail.DayCounter;
      let TodayRewards = intermediateResult + config.DailycheckInRewardInc;

      const lastClaimDate = new Date(userDetail.LastClaim);
      const timeDifferenceInMilliseconds = Math.abs(
        currentDate - lastClaimDate
      );
      // Calculate hours
      const hoursDifference = timeDifferenceInMilliseconds / 36e5;

      // Calculate days
      const daysDifference =
        timeDifferenceInMilliseconds / (1000 * 60 * 60 * 24);
      console.log("daysDifference:=", daysDifference);
      if (hoursDifference < 24) {
        return res.send({
          status: false,
          day: userDetail.DayCounter,
          TotalDayCounter: userDetail.TotalDayCounter,
          TodayRewards: TodayRewards,
          MysteryBox: false,
          CanClaimDailyReward: false,
          CanClaimMysteryBox: false,
          message: "You have already collected your reward today!",
          QuestEndDate: config.QuestEndDate,
        });
      } else {
        return res.send({
          status: true,
          day: userDetail.DayCounter,
          TotalDayCounter: userDetail.TotalDayCounter,
          TodayRewards: TodayRewards,
          MysteryBox: false,
          CanClaimDailyReward: true,
          CanClaimMysteryBox: false,
          QuestEndDate: config.QuestEndDate,
        });
      }
    } else {
      return res.send({
        status: true,
        day: 1,
        TotalDayCounter: 1,
        TodayRewards: config.DailycheckInRewardInc,
        MysteryBox: false,
        CanClaimDailyReward: true,
        CanClaimMysteryBox: false,
        QuestEndDate: config.QuestEndDate,
      });
    }
  } catch {
    return res.send({ status: false, data: null });
  }
};
const getUserInfo = async (req, res) => {
  try {
    const getUserDetails = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    if (!getUserDetails) {
      return res.send({ status: false, message: "something went wrong!" });
    }

    return res.send({ status: true, user: getUserDetails });
  } catch {
    return res.send({ status: false, data: null });
  }
};
module.exports = {
  getAllUsers,
  loginWithWallet,
  authWithDiscord,
  loginWithDiscord,
  authWithTitter,
  loginWithTwitter,
  getUserByWallet,
  updateUser,
  DailyCheckin,
  getCheckinDetails,
  signup,
  createSquad,
  importKolAddresses,
  JoinSquad,
  LeaveSquad,
  getUserInfo,
};
