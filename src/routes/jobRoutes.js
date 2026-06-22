const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createJobSchema, updateJobSchema } = require('../validators/jobValidator');
const jobService = require('../services/jobService');

router.get('/', async (req, res, next) => {
  try {
    const { skill, location, status } = req.query;
    const filters = {};
    if (skill) filters.requiredSkills = skill;
    if (location) filters.location = location;
    if (status) filters.status = status;
    const jobs = await jobService.getJobs(filters);
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
});

router.post('/', validate(createJobSchema), async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.validatedBody);
    res.status(201).json({ success: true, data: job });
  } catch (err) { next(err); }
});

router.put('/:id', validate(updateJobSchema), async (req, res, next) => {
  try {
    const job = await jobService.updateJob(req.params.id, req.validatedBody);
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await jobService.deleteJob(req.params.id);
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
