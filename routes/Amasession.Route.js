const auth = require("../middleware/authMiddleware");
const AmasessionController = require("../controller/Amasession.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });

module.exports = (router) => {
  router.post(
    "/users/importCodeData",
    upload.single("uploaded_file"),
    AmasessionController.importCodeData
  );
  router.post(
    "/users/claimAmasessionReward",
    auth,
    AmasessionController.claimReward
  );
};
