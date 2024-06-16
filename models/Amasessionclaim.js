const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    AmaCodeId: { type: mongoose.Schema.Types.ObjectId, ref: "Amasessioncode" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Amasessionclaim", schema);
