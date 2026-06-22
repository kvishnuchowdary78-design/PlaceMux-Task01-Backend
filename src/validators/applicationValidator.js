const { z } = require('zod');

const createApplicationSchema = z.object({
  jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid job ID'),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID'),
  idempotencyKey: z.string().min(8).max(128),
  skillScores: z.record(z.string(), z.number().min(0).max(100)).optional(),
  coverLetter: z.string().max(2000).optional()
});

module.exports = { createApplicationSchema };
