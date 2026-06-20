const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },
    skillThresholds: {
      type: [
        {
          skillId: {
            type: String,
            required: [true, "skillId is required for each threshold"],
            trim: true,
          },
          skillName: {
            type: String,
            required: [true, "skillName is required for each threshold"],
            trim: true,
          },
          minLevel: {
            type: Number,
            required: [true, "minLevel is required for each threshold"],
            min: [1, "minLevel must be at least L1"],
            max: [100, "minLevel cannot exceed L100"],
          },
        },
      ],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one skill threshold is required",
      },
    },
    salary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    jobType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Internship", "Contract"],
      default: "Full-Time",
    },
    status: {
      type: String,
      enum: ["Open", "Closed", "Draft"],
      default: "Open",
    },
    openings: {
      type: Number,
      default: 1,
      min: [1, "At least 1 opening required"],
    },
    assessmentLinkGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);