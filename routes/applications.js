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

    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const filter = { jobId: req.params.jobId };
    if (req.query.status) filter.status = req.query.status;

    const total = await Application.countDocuments(filter);
    const applications = await Application.find(filter)
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      jobTitle: job.title,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    if (["Rejected", "Hired"].includes(application.status) && application.status !== status) {
      return res.status(409).json({
        success: false,
        error: `Cannot change status — application is already ${application.status} (terminal state).`,
      });
    }

    application.status = status;
    await application.save();

    return res.json({ success: true, message: `Application status updated to ${status}`, data: application });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/shortlist", async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    if (["Rejected", "Hired"].includes(application.status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot shortlist — application is already ${application.status} (terminal state).`,
      });
    }

    if (application.status === "Shortlisted") {
      return res.status(200).json({
        success: true,
        message: "Application was already shortlisted",
        data: application,
      });
    }

    const failedSkill = (application.eligibilitySnapshot || []).find((s) => s.passed === false);
    if (failedSkill) {
      return res.status(403).json({
        success: false,
        error: `Cannot shortlist — candidate did not meet the required threshold for ${failedSkill.skillName}.`,
        eligibilitySnapshot: application.eligibilitySnapshot,
      });
    }

    application.status = "Shortlisted";
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Candidate shortlisted",
      data: application,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/job/:jobId/shortlisted", async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const shortlisted = await Application.find({
      jobId: req.params.jobId,
      status: "Shortlisted",
    }).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      jobTitle: job.title,
      count: shortlisted.length,
      data: shortlisted,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;