const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    userName: String,
    userAvatar: String,
    discord_name: String,
    discord_discriminator: String,
    twitter_id: String,
    twitter_username: String,
    telegram_id: String,
    telegram_username: String,
    jwt_token: String,
    ReferrerCode: String,
    MyReferralCode: String,
    FriendSquadID: String,
    MySquadID: String,
    Energy: Number,
    Tier: Number,
    KOLAccount: { type: Boolean, default: false },
    signed: { type: Boolean, default: false },
    rewardCoins: {
      type: Double,
      required: true,
      default: 0.0,
    },
    LastClaim: {
      type: Date,
      default: null,
    },
    DayCounter: { type: Number, default: 0 },
    TotalDayCounter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", schema);
