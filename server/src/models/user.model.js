const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: "" },
    accessToken: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    tokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
