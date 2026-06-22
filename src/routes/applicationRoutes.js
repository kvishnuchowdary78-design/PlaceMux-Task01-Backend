const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createApplicationSchema } = require('../validators/applicationValidator');
const { applicationLimiter } = require('../middleware/rateLimiter');
const appService = require('../services/applicationService');

router.post('/', applicationLimiter, validate(createApplicationSchema), async (req, res, next) => {
  try {
    const { application, created } = await appService.applyForJob(req.validatedBody);
    res.status(created ? 201 : 200).json({ success: true, created, data: application });
  } catch (err) { next(err); }
});

router.get('/job/:jobId/ranked', async (req, res, next) => {
  try {
    const ranked = await appService.getRankedApplicants(req.params.jobId);
    res.json({ success: true, count: ranked.length, data: ranked });
  } catch (err) { next(err); }
});

router.get('/job/:jobId', async (req, res, next) => {
  try {
    const apps = await appService.getApplicationsForJob(req.params.jobId);
    res.json({ success: true, count: apps.length, data: apps });
  } catch (err) { next(err); }
});

router.get('/student/:studentId', async (req, res, next) => {
  try {
    const apps = await appService.getStudentApplications(req.params.studentId);
    res.json({ success: true, count: apps.length, data: apps });
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const app = await appService.updateApplicationStatus(req.params.id, req.body.status);
    res.json({ success: true, data: app });
  } catch (err) { next(err); }
});

module.exports = router;
