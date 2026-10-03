const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the "Authorization: Bearer <token>" header and attaches req.user
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized — no token provided." });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized — user no longer exists." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized — invalid or expired token." });
  }
};

// Restricts a route to one or more roles, e.g. requireRole("mentor")
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: `This action requires role: ${roles.join(" or ")}.` });
  }
  next();
};

module.exports = { protect, requireRole };
