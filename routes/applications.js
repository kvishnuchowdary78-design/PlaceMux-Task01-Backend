const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const Job = require("../models/Job");

// Apply for a job
router.post("/", async (req, res, next) => {
  try {
    const { jobId, studentName, studentEmail, resume } = req.body;

    if (!jobId || !studentName || !studentEmail) {
      return res.status(400).json({
        success: false,
        error: "jobId, studentName, and studentEmail are required",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.status !== "Open") {
      return res.status(400).json({ success: false, error: `Job is ${job.status}. Cannot apply.` });
    }

    // Idempotency — block duplicate application
    const existing = await Application.findOne({ jobId, studentEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "You have already applied for this job",
        data: existing,
      });
    }

    const application = new Application({ jobId, studentName, studentEmail, resume });
    await application.save();

    return res.status(201).json({ success: true, message: "Application submitted", data: application });
  } catch (err) {
    next(err);
  }
});

// Get all applications for a job
router.get("/job/:jobId", async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const applications = await Application.find({ jobId: req.params.jobId }).sort({ appliedAt: -1 });
    return res.json({ success: true, jobTitle: job.title, count: applications.length, data: applications });
  } catch (err) {
    next(err);
  }
});

// Update application status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Applied", "Shortlisted", "Rejected", "Hired"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "status must be Applied, Shortlisted, Rejected, or Hired",
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    return res.json({ success: true, message: `Status updated to ${status}`, data: application });
  } catch (err) {
    next(err);
  }
});

module.exports = router;