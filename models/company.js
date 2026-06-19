const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      match: [/^[0-9]{10}$/, "Phone must be 10 digits"],
    },
    industry: {
      type: String,
      required: [true, "Industry is required"],
      enum: ["IT", "Finance", "Healthcare", "Education", "Manufacturing", "Other"],
    },
    website: { type: String, trim: true },
    description: { type: String, trim: true },
    kycStatus: {
      type: String,
      enum: ["Pending", "Submitted", "Verified", "Rejected"],
      default: "Pending",
    },
    kycDocuments: {
      gstNumber: String,
      panNumber: String,
      registrationNumber: String,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);