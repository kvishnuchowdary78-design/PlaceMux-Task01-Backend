const Job = require('../models/Job');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const createJob = async (data) => {
  const job = await Job.create(data);
  logger.info('Job created', { jobId: job._id });
  return job;
};

const getJobs = async (filters = {}) => {
  const query = { status: 'open', ...filters };
  return Job.find(query).populate('company', 'name logo').sort({ postedAt: -1 }).lean();
};

const getJobById = async (id) => {
  const job = await Job.findById(id).populate('company', 'name logo location');
  if (!job) throw new AppError('Job not found', 404);
  return job;
};

const updateJob = async (id, data) => {
  const job = await Job.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!job) throw new AppError('Job not found', 404);
  return job;
};

const deleteJob = async (id) => {
  const job = await Job.findByIdAndDelete(id);
  if (!job) throw new AppError('Job not found', 404);
};

const evaluateThreshold = (job, skillScores) => {
  if (!job.requiredSkills || job.requiredSkills.length === 0) {
    return { composite: 100, met: true };
  }
  const scores = job.requiredSkills.map(skill => skillScores[skill] ?? 0);
  const composite = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const met = composite >= job.competencyThreshold;
  logger.info('Threshold evaluated', { composite, threshold: job.competencyThreshold, met });
  return { composite: Math.round(composite * 100) / 100, met };
};

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob, evaluateThreshold };
