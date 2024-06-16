const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    AmaCode: { type: String, required: true, unique: true, index: true },
    rewardCoins: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Amasessioncode", schema);
