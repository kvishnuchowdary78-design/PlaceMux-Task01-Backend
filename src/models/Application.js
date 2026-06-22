const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  idempotencyKey: { type: String, required: true, unique: true },
  skillScores: { type: Map, of: Number, default: {} },
  compositeScore: { type: Number, default: 0 },
  thresholdMet: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'accepted', 'rejected'],
    default: 'pending'
  },
  coverLetter: { type: String },
  appliedAt: { type: Date, default: Date.now }
}, { timestamps: true });

applicationSchema.index({ job: 1, student: 1 });
applicationSchema.index({ idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
