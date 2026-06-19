const express = require("express");
const router = express.Router();
const Company = require("../models/Company");

// Register a company
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, phone, industry, website, description } = req.body;

    if (!name || !email || !phone || !industry) {
      return res.status(400).json({
        success: false,
        error: "name, email, phone, and industry are required",
      });
    }

    const company = new Company({ name, email, phone, industry, website, description });
    await company.save();

    return res.status(201).json({
      success: true,
      message: "Company registered. KYC pending.",
      data: company,
    });
  } catch (err) {
    next(err);
  }
});

// Get company by ID
router.get("/:id", async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }
    return res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

// Get all companies
router.get("/", async (req, res, next) => {
  try {
    const companies = await Company.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json({ success: true, count: companies.length, data: companies });
  } catch (err) {
    next(err);
  }
});

// Update company profile
router.patch("/:id/profile", async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "website", "description", "industry"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: "No valid fields to update" });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    return res.json({ success: true, message: "Profile updated", data: company });
  } catch (err) {
    next(err);
  }
});

// Submit KYC documents
router.patch("/:id/kyc", async (req, res, next) => {
  try {
    const { gstNumber, panNumber, registrationNumber } = req.body;

    if (!gstNumber && !panNumber && !registrationNumber) {
      return res.status(400).json({
        success: false,
        error: "At least one KYC document is required (gstNumber, panNumber, or registrationNumber)",
      });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    if (company.kycStatus === "Verified") {
      return res.status(400).json({ success: false, error: "KYC already verified" });
    }

    company.kycDocuments = { gstNumber, panNumber, registrationNumber };
    company.kycStatus = "Submitted";
    await company.save();

    return res.json({
      success: true,
      message: "KYC submitted. Status: Submitted.",
      data: { companyId: company._id, kycStatus: company.kycStatus },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;