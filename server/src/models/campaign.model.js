const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isEnabled: { type: Boolean, default: true },
    autoRejectEnabled: { type: Boolean, default: true },
    autoPassEnabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Campaign = mongoose.model("Campaign", campaignSchema);

module.exports = { Campaign };
