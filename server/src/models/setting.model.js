const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    criteria: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          description: { type: String, required: true, trim: true },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    autoRejectEnabled: { type: Boolean, default: true },
    autoPassEnabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Setting = mongoose.model("Setting", settingSchema);

module.exports = { Setting };
