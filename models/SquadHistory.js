const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    SQuadID: { type: mongoose.Schema.Types.ObjectId, ref: "Squad" },
    UserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    WeekID: { type: mongoose.Schema.Types.ObjectId, ref: "weeks" },
    isRewardDeduct: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SquadHistory", schema);
