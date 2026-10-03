const express = require("express");
const { requestMentor, listMyMatches, respondToMatch } = require("../controllers/matchController");
const { listMessages, sendMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // every match/message route requires a signed-in user

router.post("/", requestMentor);
router.get("/", listMyMatches);
router.patch("/:id", respondToMatch);

router.get("/:matchId/messages", listMessages);
router.post("/:matchId/messages", sendMessage);

module.exports = router;
