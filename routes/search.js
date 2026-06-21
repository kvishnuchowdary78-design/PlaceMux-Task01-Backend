const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const { rankJobsByFit, scoreJobForStudent } = require("../services/fitRankingService");

function parsePagination(req) {
  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;

  return { page, limit, skip: (page - 1) * limit };
}

router.get("/jobs", async (req, res, next) => {
  try {
    const { q, location, jobType, skillId, minSalary, maxSalary, studentEmail } = req.query;
    const { page, limit, skip } = parsePagination(req);

    if (minSalary !== undefined && Number.isNaN(Number(minSalary))) {
      return res.status(400).json({ success: false, error: "minSalary must be a number" });
    }
    if (maxSalary !== undefined && Number.isNaN(Number(maxSalary))) {
      return res.status(400).json({ success: false, error: "maxSalary must be a number" });
    }

    const filter = { status: "Open" };
    let usingTextSearch = false;

    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
      usingTextSearch = true;
    }
    if (location) filter.location = new RegExp(location, "i");
    if (jobType) filter.jobType = jobType;
    if (skillId) filter["skillThresholds.skillId"] = skillId;
    if (minSalary || maxSalary) {
      filter["salary.max"] = {};
      if (minSalary) filter["salary.max"].$gte = Number(minSalary);
      if (maxSalary) filter["salary.min"] = { $lte: Number(maxSalary) };
    }

    let query = Job.find(filter).populate("companyId", "name industry website kycStatus");

    if (usingTextSearch) {
      query = query.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const total = await Job.countDocuments(filter);

    if (studentEmail) {
      const candidatePool = await query.limit(500);
      const ranked = await rankJobsByFit(studentEmail, candidatePool);
      const pageSlice = ranked.slice(skip, skip + limit);

      return res.json({
        success: true,
        mode: "personalized-fit",
        query: q || null,
        studentEmail: studentEmail.toLowerCase().trim(),
        page,
        limit,
        total: ranked.length,
        totalPages: Math.ceil(ranked.length / limit),
        data: pageSlice.map((r) => ({
          ...r.job.toObject(),
          fitScore: r.fitScore,
          fitBreakdown: r.fitBreakdown,
        })),
      });
    }

    const jobs = await query.skip(skip).limit(limit);

    return res.json({
      success: true,
      mode: usingTextSearch ? "text-search" : "browse",
      query: q || null,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: jobs,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/jobs/:id/fit", async (req, res, next) => {
  try {
    const { studentEmail } = req.query;

    if (!studentEmail) {
      return res.status(400).json({ success: false, error: "studentEmail query param is required" });
    }

    const job = await Job.findById(req.params.id).populate("companyId", "name industry");
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const { fitScore, perSkill } = await scoreJobForStudent(studentEmail, job.skillThresholds);

    return res.json({
      success: true,
      jobId: job._id,
      jobTitle: job.title,
      studentEmail: studentEmail.toLowerCase().trim(),
      fitScore,
      fitBreakdown: perSkill,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/recommended", async (req, res, next) => {
  try {
    const { studentEmail } = req.query;
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isInteger(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    if (!studentEmail) {
      return res.status(400).json({ success: false, error: "studentEmail query param is required" });
    }

    const openJobs = await Job.find({ status: "Open" })
      .populate("companyId", "name industry website")
      .limit(500);

    const ranked = await rankJobsByFit(studentEmail, openJobs);
    const top = ranked.slice(0, limit);

    return res.json({
      success: true,
      studentEmail: studentEmail.toLowerCase().trim(),
      count: top.length,
      data: top.map((r) => ({
        ...r.job.toObject(),
        fitScore: r.fitScore,
        fitBreakdown: r.fitBreakdown,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;