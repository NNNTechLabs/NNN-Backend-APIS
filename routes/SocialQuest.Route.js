const auth = require("../middleware/authMiddleware");
const SocialQuestController = require("../controller/SocialQuest.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });

module.exports = (router) => {
  router.post(
    "/social/addTwitterData",
    upload.single("uploaded_file"),
    SocialQuestController.importTwitterData
  );
  router.post(
    "/social/addDiscordData",
    upload.single("uploaded_file"),
    SocialQuestController.importDiscordData
  );
  router.post(
    "/social/addTelegramData",
    upload.single("uploaded_file"),
    SocialQuestController.importTelegramData
  );
  router.get(
    "/social/getSocialQuestList",
    auth,
    SocialQuestController.getSocialQuestList
  );
  router.get("/social/verifyMission", auth, SocialQuestController.claimReward);
  router.get(
    "/social/claimRewardMission",
    auth,
    SocialQuestController.claimReward
  );
};
