const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const Company = require("../models/Company");
const AssessmentLink = require("../models/AssessmentLink");
const { evaluateCandidate } = require("../services/thresholdEngine");

function validateSkillThresholds(skillThresholds) {
  if (!Array.isArray(skillThresholds) || skillThresholds.length === 0) {
    return "skillThresholds must be a non-empty array";
  }

  for (const [i, t] of skillThresholds.entries()) {
    if (!t.skillId || !t.skillName) {
      return `skillThresholds[${i}] is missing skillId or skillName`;
    }
    if (typeof t.minLevel !== "number" || t.minLevel < 1 || t.minLevel > 100) {
      return `skillThresholds[${i}].minLevel must be a number between L1 and L100`;
    }
  }
  return null;
}

router.post("/", async (req, res, next) => {
  try {
    const {
      companyId,
      title,
      description,
      skillThresholds,
      salary,
      location,
      jobType,
      openings,
    } = req.body;

    if (!companyId || !title || !description || !location) {
      return res.status(400).json({
        success: false,
        error: "companyId, title, description, and location are required",
      });
    }

    const thresholdError = validateSkillThresholds(skillThresholds);
    if (thresholdError) {
      return res.status(400).json({ success: false, error: thresholdError });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found. Register the company first.",
      });
    }

    if (company.kycStatus === "Pending") {
      return res.status(403).json({
        success: false,
        error: "Company KYC is pending. Submit KYC documents before posting jobs.",
      });
    }

    const job = new Job({
      companyId,
      title,
      description,
      skillThresholds,
      salary,
      location,
      jobType,
      openings,
    });
    await job.save();

    let assessmentLink;
    try {
      assessmentLink = await AssessmentLink.create({ jobId: job._id });
      job.assessmentLinkGenerated = true;
      await job.save();
    } catch (linkErr) {
      return res.status(201).json({
        success: true,
        message: "Job posted, but assessment link generation failed. Retry via /api/jobs/:id/assessment-link",
        data: job,
        linkError: linkErr.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Job posted successfully with skill thresholds",
      data: job,
      assessmentLink: {
        token: assessmentLink.token,
        url: assessmentLink.toPublicUrl(`${req.protocol}://${req.get("host")}`),
        expiresAt: assessmentLink.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/assessment-link", async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    let link = await AssessmentLink.findOne({ jobId: job._id });
    if (!link) {
      link = await AssessmentLink.create({ jobId: job._id });
      job.assessmentLinkGenerated = true;
      await job.save();
    }

    return res.status(200).json({
      success: true,
      message: "Assessment link ready",
      assessmentLink: {
        token: link.token,
        url: link.toPublicUrl(`${req.protocol}://${req.get("host")}`),
        status: link.status,
        expiresAt: link.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { location, jobType, skillId } = req.query;
    const filter = { status: "Open" };

    if (location) filter.location = new RegExp(location, "i");
    if (jobType) filter.jobType = jobType;
    if (skillId) filter["skillThresholds.skillId"] = skillId;

    const jobs = await Job.find(filter)
      .populate("companyId", "name industry website kycStatus")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
});

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

router.post("/:id/check-eligibility", async (req, res, next) => {
  try {
    const { studentEmail } = req.body;

    if (!studentEmail) {
      return res.status(400).json({ success: false, error: "studentEmail is required" });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const result = await evaluateCandidate(studentEmail, job.skillThresholds);

    return res.json({
      success: true,
      jobId: job._id,
      jobTitle: job.title,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["Open", "Closed", "Draft"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "status must be one of: Open, Closed, Draft",
      });
    }

    const job = await Job.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    return res.json({ success: true, message: `Job status updated to ${status}`, data: job });
  } catch (err) {
    next(err);
  }
});

module.exports = router;