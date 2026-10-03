const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, roleLine, location } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "name, email, password, and role are required." });
    }

    if (!["mentor", "mentee"].includes(role)) {
      return res
        .status(400)
        .json({ message: "role must be either 'mentor' or 'mentee'." });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
      email: normalizedEmail,
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "An account with that email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      roleLine: roleLine?.trim() || "",
      location,
    });

    const userObject = user.toObject();
    delete userObject.password;

    res.status(201).json({
      token: generateToken(user._id),
      user: userObject,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required." });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const userObject = user.toObject();
    delete userObject.password;

    res.json({
      token: generateToken(user._id),
      user: userObject,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    let user = req.user;

    if (user.role === "mentee") {
      user = await User.findById(user._id).populate(
        "mentor",
        "name roleLine location skills stats availability sessionDetails initials",
      );
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const {
      name,
      roleLine,
      location,
      about,
      skills,
      availability,
      sessionDetails,
      timeline,
      focus,
      progressStats,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Shared profile fields
    if (typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (typeof roleLine === "string") {
      user.roleLine = roleLine.trim();
    }

    if (typeof location === "string") {
      user.location = location.trim();
    }

    if (typeof about === "string") {
      user.about = about.trim();
    }

    // Skills
    if (Array.isArray(skills)) {
      user.skills = skills
        .filter((skill) => typeof skill === "string")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    // Mentor-only fields
    if (user.role === "mentor") {
      if (Array.isArray(availability)) {
        user.availability = availability;
      }

      if (
        sessionDetails &&
        typeof sessionDetails === "object" &&
        !Array.isArray(sessionDetails)
      ) {
        if (typeof sessionDetails.format === "string") {
          user.sessionDetails.format = sessionDetails.format.trim();
        }

        if (typeof sessionDetails.price === "string") {
          user.sessionDetails.price = sessionDetails.price.trim();
        }

        if (typeof sessionDetails.responds === "string") {
          user.sessionDetails.responds = sessionDetails.responds.trim();
        }
      }
    }

    // Mentee-only fields
    if (user.role === "mentee") {
      if (Array.isArray(timeline)) {
        user.timeline = timeline;
      }

      if (focus && typeof focus === "object" && !Array.isArray(focus)) {
        if (typeof focus.focus === "string") {
          user.focus.focus = focus.focus.trim();
        }

        if (typeof focus.stage === "string") {
          user.focus.stage = focus.stage.trim();
        }

        if (typeof focus.lookingFor === "string") {
          user.focus.lookingFor = focus.lookingFor.trim();
        }
      }

      if (Array.isArray(progressStats)) {
        user.progressStats = progressStats;
      }
    }

    await user.save();

    const userObject = user.toObject();
    delete userObject.password;

    res.json({
      message: "Profile updated successfully.",
      user: userObject,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
};
