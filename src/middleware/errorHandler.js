// Catches anything thrown/passed to next(err) and returns a consistent JSON shape
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Mongoose duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    return res.status(409).json({ message: "That value is already in use.", field: Object.keys(err.keyPattern || {})[0] });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({ message: err.message || "Something went wrong on our end." });
};

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
