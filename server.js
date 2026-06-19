require("dotenv").config();

const express = require("express");
const connectDB = require("./db");
const errorHandler = require("./middleware/errorHandler");

const companyRoutes = require("./routes/company");
const jobRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");

const app = express();

app.use(express.json());

connectDB();

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "PlaceMux API running" });
});

// Routes
app.use("/api/company", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// Central error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});