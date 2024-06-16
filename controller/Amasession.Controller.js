const csv = require("fast-csv");
const UserService = require("../service/user");
const config = require("../config/Config");
const AmasessioncodeModel = require("../models/Amasessioncode");
const AmasessionclaimModel = require("../models/Amasessionclaim");
const ObjectId = require("mongoose").Types.ObjectId;

/*
const importCodeData = async (req, res) => {
  const filePath = req.file.destination + req.file.filename;
  var fs = require("fs");
  fileRows = [];
  PrePresentCodes = [];
  let counter = 0;
  csv
    .parseFile(req.file.path)
    .on("data", function (data) {
      let amaCode = data[0].trim();
      let rewardPoints = data[1].trim();
      if (counter != 0) {
        fileRows.push({ amaCode, rewardPoints });
      }
      counter++;
    })
    .on("end", function () {
      fs.unlinkSync(req.file.path);
      fileRows.forEach(async function (currentElement, index) {
        let post = await AmasessioncodeModel.findOne({
          ReferralCode: currentElement,
        });
        if (post) {
          PrePresentCodes.push(currentElement[0]);
        } else {
          console.log("referal code:", currentElement[0]);
          console.log("referal reward:", currentElement[1]);

          const post = new AmasessioncodeModel({
            AmaCode: currentElement[0],
            rewardCoins: currentElement[1],
          });
          await post.save();
        }
      });

      return res.send({
        status: true,
        message: "Data Imported.",
      });
    });
};
*/
const importCodeData = async (req, res) => {
  var fs = require("fs");
  const filePath = req.file.path;
  let fileRows = [];
  let prePresentCodes = [];
  let counter = 0;

  csv
    .parseFile(filePath)
    .on("data", function (data) {
      let amaCode = data[0].trim();
      let rewardPoints = data[1].trim();
      if (counter != 0) {
        fileRows.push({ amaCode, rewardPoints });
      }
      counter++;
    })
    .on("end", async function () {
      fs.unlinkSync(filePath);
      const processingResults = await Promise.all(
        fileRows.map(async ({ amaCode, rewardPoints }) => {
          let post = await AmasessioncodeModel.findOne({ AmaCode: amaCode });
          if (post) {
            prePresentCodes.push(amaCode);
          } else {
            const newPost = new AmasessioncodeModel({
              AmaCode: amaCode,
              rewardCoins: rewardPoints,
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
const claimReward = async (req, res) => {
  try {
    const userDetail = await UserService.getUserBy({
      _id: req.userDetails._id,
    });
    if (!userDetail)
      return res.send({ status: false, message: "something went wrong!" });

    const currentDate = new Date();
    const amaCode = req.body.claimCode.trim();

    const post = await AmasessioncodeModel.findOne({ AmaCode: amaCode });
    if (post) {
      const checkPreClaimed = await AmasessionclaimModel.findOne({
        AmaCodeId: post._id,
        userId: userDetail._id,
      });
      if (!checkPreClaimed) {
        const updatedUser = await UserService.updateUserRewards(
          userDetail.id,
          post.rewardCoins
        );

        const newPost = new AmasessionclaimModel({
          AmaCodeId: post._id,
          userId: userDetail._id,
        });
        await newPost.save();
        return res.send({
          status: true,
          UserDetails: updatedUser,
        });
      } else {
        return res.send({
          status: false,
          message: "You already claimed",
        });
      }
    } else {
      return res.send({
        status: false,
        message: "Code not Present",
      });
    }
  } catch {
    return res.send({ status: false, data: null });
  }
};
module.exports = {
  importCodeData,
  claimReward,
};
