const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    WeekID: { type: mongoose.Schema.Types.ObjectId, ref: "weeks" },
    UserID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    SQuadID: { type: mongoose.Schema.Types.ObjectId, ref: "Squad" },
    TotalRewards: {
      type: Double,
      required: true,
      default: 0.0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leaderboard", schema);
