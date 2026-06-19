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
      required: [true, "Description is required"],
      trim: true,
    },
    skills: { type: [String], default: [] },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);