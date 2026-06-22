const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  skills: [{ type: String }],
  skillScores: { type: Map, of: Number, default: {} },
  resume: { type: String },
  college: { type: String },
  graduationYear: { type: Number },
  cgpa: { type: Number, min: 0, max: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
