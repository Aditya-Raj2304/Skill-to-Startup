const express = require("express");
const { chatWithMira } = require("../controllers/miraController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/chat", protect, chatWithMira); // now requires a signed-in user, to control Gemini API cost/abuse

module.exports = router;
