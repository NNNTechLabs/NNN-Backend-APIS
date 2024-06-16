const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    Link: { type: String, required: true, unique: true, index: true },
    missionName: String,
    Type: { type: Number, default: 0 },
    Rewards: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscordQuest", schema);
