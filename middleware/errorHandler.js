const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: "Validation failed", details: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, error: `${field} already exists` });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ success: false, error: `Invalid ID: ${err.value}` });
  }

  return res.status(500).json({ success: false, error: "Internal server error" });
};

module.exports = errorHandler;