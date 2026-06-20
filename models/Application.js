const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    studentEmail: {
      type: String,
      required: [true, "Student email is required"],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    resume: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Applied", "Shortlisted", "Rejected", "Hired"],
      default: "Applied",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    eligibilitySnapshot: {
      type: [
        {
          skillId: String,
          skillName: String,
          requiredLevel: Number,
          candidateLevel: Number,
          passed: Boolean,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, studentEmail: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);