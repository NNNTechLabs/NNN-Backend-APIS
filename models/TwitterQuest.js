const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    Link: { type: String, required: true, unique: true, index: true },
    missionName: String,
    Follow: { type: Boolean, default: false },
    Like: { type: Boolean, default: false },
    Retweet: { type: Boolean, default: false },
    Comment: { type: Boolean, default: false },
    FollowRewards: { type: Number, default: 0 },
    LikeRewards: { type: Number, default: 0 },
    RetweetRewards: { type: Number, default: 0 },
    CommentRewards: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TwitterQuest", schema);
