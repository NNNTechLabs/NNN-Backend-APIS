const auth = require("../middleware/authMiddleware");
const UserController = require("../controller/User.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });

module.exports = (router) => {
  router.get("/users/list", UserController.getAllUsers);

  router.post("/users/loginwithwallet", UserController.loginWithWallet);

  router.post("/users/signup", UserController.signup);

  router.post("/users/authwithdiscord", UserController.authWithDiscord);

  router.post("/users/loginwithdiscord", UserController.loginWithDiscord);

  router.post("/users/authwithtwitter", UserController.authWithTitter);

  router.post("/users/loginwithtwitter", UserController.loginWithTwitter);

  router.post(
    "/users/addKOLData",
    upload.single("uploaded_file"),
    UserController.importKolAddresses
  );
  router.get(
    "/users/walletaddress/:walletaddress",
    UserController.getUserByWallet
  );
  router.patch("/users/", auth, UserController.updateUser);
  router.get("/users/getUserInfo", auth, UserController.getUserInfo);

  /*
  router.get("/users/createOwnSquad", auth, UserController.createSquad);
  router.post("/users/JoinSquad", auth, UserController.JoinSquad);
  router.get("/users/LeaveSquad", auth, UserController.LeaveSquad);
*/
  router.get("/users/dailycheckin", auth, UserController.DailyCheckin);
  router.get(
    "/users/getCheckinDetails",
    auth,
    UserController.getCheckinDetails
  );
};
