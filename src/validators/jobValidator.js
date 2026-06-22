const { z } = require('zod');

const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  company: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid company ID'),
  requiredSkills: z.array(z.string()).min(1),
  competencyThreshold: z.number().min(0).max(100).default(60),
  location: z.string().optional(),
  salary: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    currency: z.string().default('INR')
  }).optional(),
  status: z.enum(['open', 'closed', 'draft']).default('open')
});

const updateJobSchema = createJobSchema.partial();

module.exports = { createJobSchema, updateJobSchema };
