const auth = require("../middleware/authMiddleware");
const SquadController = require("../controller/Squad.Controller");

module.exports = (router) => {
  router.get(
    "/squad/getListOfAvailableSquad",
    auth,
    SquadController.getListOfSquad
  );
  router.post("/squad/createSquad", auth, SquadController.createSquad);
  router.post("/squad/getSquadInfo", auth, SquadController.getSquadInfo);
  router.post("/squad/JoinSquadByCode", auth, SquadController.JoinSquadByCode);
  router.get(
    "/squad/JoinSquadByLink/:UserID/:SquadID",
    auth,
    SquadController.JoinSquadByLink
  );
  router.get("/squad/LeaveSquad", auth, SquadController.LeaveSquad);
};
