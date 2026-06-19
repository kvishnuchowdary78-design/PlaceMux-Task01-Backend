const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const Company = require("../models/Company");

// Create a job
router.post("/", async (req, res, next) => {
  try {
    const { companyId, title, description, skills, salary, location, jobType, openings } = req.body;

    if (!companyId || !title || !description || !location) {
      return res.status(400).json({
        success: false,
        error: "companyId, title, description, and location are required",
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    if (company.kycStatus === "Pending") {
      return res.status(403).json({
        success: false,
        error: "Submit KYC documents before posting jobs",
      });
    }

    const job = new Job({ companyId, title, description, skills, salary, location, jobType, openings });
    await job.save();

    return res.status(201).json({ success: true, message: "Job posted", data: job });
  } catch (err) {
    next(err);
  }
});

// Get all open jobs
router.get("/", async (req, res, next) => {
  try {
    const jobs = await Job.find({ status: "Open" })
      .populate("companyId", "name industry website")
      .sort({ createdAt: -1 });
    return res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
});

// Get single job
router.get("/:id", async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate("companyId", "name industry website");
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    return res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

// Update job status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Open", "Closed", "Draft"].includes(status)) {
      return res.status(400).json({ success: false, error: "status must be Open, Closed, or Draft" });
    }

    const job = await Job.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    return res.json({ success: true, message: `Job status set to ${status}`, data: job });
  } catch (err) {
    next(err);
  }
});

module.exports = router;