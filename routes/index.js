const express = require("express");
const router = express.Router();
require("./User.Route")(router);
require("./Amasession.Route")(router);
require("./SocialQuest.Route")(router);
require("./Squad.Route")(router);
require("./LeaderBoard.Route")(router);

module.exports = router;
