const mongoose = require("mongoose");
const crypto = require("crypto");

const assessmentLinkSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
      unique: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    status: {
      type: String,
      enum: ["Active", "Expired", "Disabled"],
      default: "Active",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

assessmentLinkSchema.methods.toPublicUrl = function (baseUrl) {
  return `${baseUrl}/assess/${this.token}`;
};

module.exports = mongoose.model("AssessmentLink", assessmentLinkSchema);