const CompetencyScore = require("../models/CompetencyScore");

async function evaluateCandidate(studentEmail, skillThresholds) {
  const email = studentEmail.toLowerCase().trim();

  const skillIds = skillThresholds.map((t) => t.skillId);
  const scores = await CompetencyScore.find({
    studentEmail: email,
    skillId: { $in: skillIds },
  });

  const scoreMap = {};
  scores.forEach((s) => {
    scoreMap[s.skillId] = s.level;
  });

  const breakdown = skillThresholds.map((threshold) => {
    const candidateLevel = scoreMap[threshold.skillId] ?? null;
    const passed = candidateLevel !== null && candidateLevel >= threshold.minLevel;

    return {
      skillId: threshold.skillId,
      skillName: threshold.skillName,
      requiredLevel: threshold.minLevel,
      candidateLevel,
      passed,
      reason:
        candidateLevel === null
          ? "No competency score on record for this skill"
          : passed
          ? "Meets threshold"
          : `Below threshold (has L${candidateLevel}, needs L${threshold.minLevel})`,
    };
  });

  const eligible = breakdown.every((b) => b.passed);

  return {
    studentEmail: email,
    eligible,
    breakdown,
  };
}

module.exports = { evaluateCandidate };