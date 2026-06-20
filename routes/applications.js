const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const Job = require("../models/Job");
const { evaluateCandidate } = require("../services/thresholdEngine");

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
      return res.status(400).json({ success: false, error: `Cannot apply. Job is currently ${job.status}.` });
    }

    const existing = await Application.findOne({ jobId, studentEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "You have already applied for this job.",
        data: existing,
      });
    }

    const eligibility = await evaluateCandidate(studentEmail, job.skillThresholds);

    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        error: "Application blocked: does not meet required skill thresholds",
        eligibility,
      });
    }

    const application = new Application({
      jobId,
      studentName,
      studentEmail,
      resume,
      eligibilitySnapshot: eligibility.breakdown,
    });
    await application.save();

    return res.status(201).json({
      success: true,
      message: "Application submitted — all skill thresholds met",
      data: application,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/job/:jobId", async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const applications = await Application.find({ jobId: req.params.jobId }).sort({ appliedAt: -1 });

    return res.json({
      success: true,
      jobTitle: job.title,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["Applied", "Shortlisted", "Rejected", "Hired"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "status must be one of: Applied, Shortlisted, Rejected, Hired",
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

    return res.json({ success: true, message: `Application status updated to ${status}`, data: application });
  } catch (err) {
    next(err);
  }
});

module.exports = router;