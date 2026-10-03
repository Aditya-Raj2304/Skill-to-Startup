const express = require("express");
const { getMentee, updateOwnMenteeProfile } = require("../controllers/menteeController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.put("/me", protect, requireRole("mentee"), updateOwnMenteeProfile); // must come before "/:id"
router.get("/:id", protect, getMentee); // self or assigned mentor only

module.exports = router;
