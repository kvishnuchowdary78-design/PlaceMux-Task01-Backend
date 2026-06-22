const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  location: { type: String },
  logo: { type: String },
  website: { type: String },
  description: { type: String },
  industry: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
