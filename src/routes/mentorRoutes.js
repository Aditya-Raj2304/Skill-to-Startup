const express = require("express");
const { listMentors, getMentor, updateOwnMentorProfile } = require("../controllers/mentorController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", listMentors); // public directory
router.put("/me", protect, requireRole("mentor"), updateOwnMentorProfile); // must come before "/:id"
router.get("/:id", getMentor); // public full profile

module.exports = router;
