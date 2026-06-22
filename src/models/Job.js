const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  requiredSkills: [{ type: String }],
  competencyThreshold: { type: Number, required: true, min: 0, max: 100, default: 60 },
  location: { type: String },
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  status: { type: String, enum: ['open', 'closed', 'draft'], default: 'open' },
  postedAt: { type: Date, default: Date.now }
}, { timestamps: true });

jobSchema.index({ company: 1, status: 1 });
jobSchema.index({ requiredSkills: 1 });

module.exports = mongoose.model('Job', jobSchema);
