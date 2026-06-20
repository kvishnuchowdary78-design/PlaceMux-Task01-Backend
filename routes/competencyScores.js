const express = require("express");
const router = express.Router();
const CompetencyScore = require("../models/CompetencyScore");

router.post("/", async (req, res, next) => {
  try {
    const { studentEmail, skillId, skillName, level } = req.body;

    if (!studentEmail || !skillId || !skillName || level === undefined) {
      return res.status(400).json({
        success: false,
        error: "studentEmail, skillId, skillName, and level are required",
      });
    }

    if (typeof level !== "number" || level < 1 || level > 100) {
      return res.status(400).json({
        success: false,
        error: "level must be a number between L1 and L100",
      });
    }

    const score = await CompetencyScore.findOneAndUpdate(
      { studentEmail: studentEmail.toLowerCase().trim(), skillId },
      { $set: { skillName, level } },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Competency score recorded",
      data: score,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:studentEmail", async (req, res, next) => {
  try {
    const scores = await CompetencyScore.find({
      studentEmail: req.params.studentEmail.toLowerCase().trim(),
    }).sort({ skillName: 1 });

    return res.json({ success: true, count: scores.length, data: scores });
  } catch (err) {
    next(err);
  }
});

module.exports = router;