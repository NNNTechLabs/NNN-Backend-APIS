const auth = require("../middleware/authMiddleware");
const LeaderBoardController = require("../controller/LeaderBoard.Controller");

module.exports = (router) => {
  router.get(
    "/leaderboard/getDatabyUser/:PageNo",
    auth,
    LeaderBoardController.getindividualLeaderBoardData
  );

  router.get(
    "/leaderboard/individual/currentweek/:PageNo",
    auth,
    LeaderBoardController.getindividualCurrentLeaderBoardData
  );

  router.get(
    "/leaderboard/individual/previousweek/:PageNo",
    auth,
    LeaderBoardController.getindividualPreviousLeaderBoardData
  );

  router.get(
    "/leaderboard/individual/alltime/:PageNo",
    auth,
    LeaderBoardController.getindividualAllTimeLeaderBoardData
  );

  router.get(
    "/leaderboard/getDatabySquad/:PageNo",
    auth,
    LeaderBoardController.getDatabySquad
  );

  router.get(
    "/leaderboard/squad/currentweek/:PageNo",
    auth,
    LeaderBoardController.getSquadCurrentLeaderBoardData
  );

  router.get(
    "/leaderboard/squad/previousweek/:PageNo",
    auth,
    LeaderBoardController.getSquadPreviousLeaderBoardData
  );

  router.get(
    "/leaderboard/squad/alltime/:PageNo",
    auth,
    LeaderBoardController.getSquadAllTimeLeaderBoardData
  );
};
