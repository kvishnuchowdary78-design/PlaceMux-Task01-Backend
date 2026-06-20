const mongoose = require("mongoose");

const competencyScoreSchema = new mongoose.Schema(
  {
    studentEmail: {
      type: String,
      required: [true, "Student email is required"],
      lowercase: true,
      trim: true,
    },
    skillId: {
      type: String,
      required: [true, "skillId is required"],
      trim: true,
    },
    skillName: {
      type: String,
      required: [true, "skillName is required"],
      trim: true,
    },
    level: {
      type: Number,
      required: [true, "level is required"],
      min: [1, "level must be at least L1"],
      max: [100, "level cannot exceed L100"],
    },
    source: {
      type: String,
      default: "AI/ML Competency Engine",
    },
  },
  { timestamps: true }
);

competencyScoreSchema.index({ studentEmail: 1, skillId: 1 }, { unique: true });

module.exports = mongoose.model("CompetencyScore", competencyScoreSchema);