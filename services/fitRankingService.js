const CompetencyScore = require("../models/CompetencyScore");

async function scoreJobForStudent(studentEmail, skillThresholds) {
  const email = studentEmail.toLowerCase().trim();

  if (!skillThresholds || skillThresholds.length === 0) {
    return { fitScore: 0, perSkill: [] };
  }

  const skillIds = skillThresholds.map((t) => t.skillId);
  const scores = await CompetencyScore.find({
    studentEmail: email,
    skillId: { $in: skillIds },
  });

  const scoreMap = {};
  scores.forEach((s) => {
    scoreMap[s.skillId] = s.level;
  });

  const perSkill = skillThresholds.map((threshold) => {
    const candidateLevel = scoreMap[threshold.skillId] ?? null;

    let points;
    if (candidateLevel === null) {
      points = 0;
    } else if (candidateLevel >= threshold.minLevel) {
      const headroomBonus = Math.min(10, (candidateLevel - threshold.minLevel) / 10);
      points = Math.min(100, 90 + headroomBonus);
    } else {
      points = Math.round((candidateLevel / threshold.minLevel) * 100);
    }

    return {
      skillId: threshold.skillId,
      skillName: threshold.skillName,
      requiredLevel: threshold.minLevel,
      candidateLevel,
      points: Math.round(points),
    };
  });

  const fitScore = Math.round(
    perSkill.reduce((sum, s) => sum + s.points, 0) / perSkill.length
  );

  return { fitScore, perSkill };
}

async function rankJobsByFit(studentEmail, jobs) {
  const ranked = await Promise.all(
    jobs.map(async (job) => {
      const { fitScore, perSkill } = await scoreJobForStudent(studentEmail, job.skillThresholds);
      return {
        job,
        fitScore,
        fitBreakdown: perSkill,
      };
    })
  );

  ranked.sort((a, b) => b.fitScore - a.fitScore);
  return ranked;
}

module.exports = { scoreJobForStudent, rankJobsByFit };