const Application = require('../models/Application');
const { getJobById, evaluateThreshold } = require('./jobService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const applyForJob = async ({ jobId, studentId, idempotencyKey, skillScores = {}, coverLetter }) => {
  const existing = await Application.findOne({ idempotencyKey });
  if (existing) {
    logger.info('Idempotent application returned', { idempotencyKey });
    return { application: existing, created: false };
  }

  const job = await getJobById(jobId);
  if (job.status !== 'open') throw new AppError('Job is not accepting applications', 400);

  const duplicate = await Application.findOne({ job: jobId, student: studentId });
  if (duplicate) throw new AppError('Already applied for this job', 409);

  const { composite, met } = evaluateThreshold(job, skillScores);

  const application = await Application.create({
    job: jobId,
    student: studentId,
    idempotencyKey,
    skillScores,
    compositeScore: composite,
    thresholdMet: met,
    coverLetter,
    status: met ? 'under_review' : 'pending'
  });

  logger.info('Application created', { applicationId: application._id, thresholdMet: met });
  return { application, created: true };
};

const getApplicationsForJob = async (jobId) => {
  return Application.find({ job: jobId })
    .populate('student', 'name email skills cgpa')
    .sort({ compositeScore: -1 })
    .lean();
};

const getRankedApplicants = async (jobId) => {
  const apps = await getApplicationsForJob(jobId);
  return apps.sort((a, b) => {
    if (b.thresholdMet !== a.thresholdMet) return b.thresholdMet ? 1 : -1;
    return b.compositeScore - a.compositeScore;
  });
};

const getStudentApplications = async (studentId) => {
  return Application.find({ student: studentId })
    .populate('job', 'title company status')
    .sort({ appliedAt: -1 })
    .lean();
};

const updateApplicationStatus = async (applicationId, status) => {
  const valid = ['pending', 'under_review', 'accepted', 'rejected'];
  if (!valid.includes(status)) throw new AppError('Invalid status', 400);
  const app = await Application.findByIdAndUpdate(applicationId, { status }, { new: true });
  if (!app) throw new AppError('Application not found', 404);
  return app;
};

module.exports = { applyForJob, getApplicationsForJob, getRankedApplicants, getStudentApplications, updateApplicationStatus };
