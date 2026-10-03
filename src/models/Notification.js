const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who receives it
    type: {
      type: String,
      enum: ["match_requested", "match_accepted", "match_declined", "new_message"],
      required: true,
    },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedMatch: { type: mongoose.Schema.Types.ObjectId, ref: "Match", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
