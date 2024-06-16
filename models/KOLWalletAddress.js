const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    WalletAddress: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KOLWalletAddress", schema);
