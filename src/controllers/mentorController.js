const User = require("../models/User");

// GET /api/mentors  — public directory, used by the index "Meet mentors" grid
const listMentors = async (req, res, next) => {
  try {
    const mentors = await User.find({ role: "mentor" }).select(
      "name roleLine location skills stats initials"
    );
    res.json({ mentors });
  } catch (error) {
    next(error);
  }
};

// GET /api/mentors/:id  — public full profile, used by profile.html?view=mentor&id=...
const getMentor = async (req, res, next) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: "mentor" });
    if (!mentor) return res.status(404).json({ message: "Mentor not found." });
    res.json({ mentor });
  } catch (error) {
    next(error);
  }
};

// PUT /api/mentors/me  — protected, mentor editing their own profile
const updateOwnMentorProfile = async (req, res, next) => {
  try {
    const allowedFields = ["roleLine", "location", "about", "skills", "availability", "sessionDetails"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const mentor = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ mentor });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMentors, getMentor, updateOwnMentorProfile };
