const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "active", "declined"], default: "pending" },
  },
  { timestamps: true }
);

// A mentee can only have one open (pending or active) request to a given mentor
matchSchema.index({ mentee: 1, mentor: 1 }, { unique: true });

module.exports = mongoose.model("Match", matchSchema);
