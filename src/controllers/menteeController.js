const User = require("../models/User");

// GET /api/mentees/:id  — protected. Only the mentee themself, or their assigned mentor, can view it.
const getMentee = async (req, res, next) => {
  try {
    const mentee = await User.findOne({ _id: req.params.id, role: "mentee" }).populate(
      "mentor",
      "name roleLine location skills stats availability sessionDetails initials"
    );
    if (!mentee) return res.status(404).json({ message: "Mentee not found." });

    const isSelf = String(mentee._id) === String(req.user._id);
    const isTheirMentor = mentee.mentor && String(mentee.mentor._id) === String(req.user._id);

    if (!isSelf && !isTheirMentor) {
      return res.status(403).json({ message: "You don't have access to this mentee's profile." });
    }

    res.json({ mentee });
  } catch (error) {
    next(error);
  }
};

// PUT /api/mentees/me  — protected, mentee editing their own profile
const updateOwnMenteeProfile = async (req, res, next) => {
  try {
    const allowedFields = ["roleLine", "location", "about", "skills", "focus", "progressStats"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const mentee = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ mentee });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMentee, updateOwnMenteeProfile };
