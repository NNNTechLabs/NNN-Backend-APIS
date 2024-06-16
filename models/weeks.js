const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");
const schema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("weeks", schema);
