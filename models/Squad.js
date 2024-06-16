const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    SquadCode: { type: String, required: true, unique: true, index: true },
    SquadName: { type: String, required: true },
    UserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    RankName: { type: String, default: "Bronze" },
    RankNumber: { type: Number, default: 0 },
    IsLeftByOwner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Squad", schema);
