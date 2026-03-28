const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null, index: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    skills: { type: [String], default: [] },
    experience_years: { type: Number, default: 0 },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    score: { type: Number, default: 0 },
    decision: { type: String, enum: ["pass", "reject"], default: "reject" },
    reason: { type: String, default: "" },
    raw_cv_text: { type: String, default: "" },
    source_message_id: { type: String, default: "", index: true },
    source_attachment_name: { type: String, default: "" },
    source_file_url: { type: String, default: "" },
    source_file_mime_type: { type: String, default: "" },
    source_file_size: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const Candidate = mongoose.model("Candidate", candidateSchema);

module.exports = { Candidate };
