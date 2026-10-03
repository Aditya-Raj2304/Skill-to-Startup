const Match = require("../models/Match");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

const assertParticipant = (match, userId) => {
  const isMentee = String(match.mentee) === String(userId);
  const isMentor = String(match.mentor) === String(userId);
  return isMentee || isMentor;
};

// GET /api/matches/:matchId/messages
const listMessages = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: "Match not found." });
    if (!assertParticipant(match, req.user._id)) {
      return res
        .status(403)
        .json({ message: "You're not part of this conversation." });
    }

    const messages = await Message.find({ match: match._id }).sort({
      createdAt: 1,
    });

    // Mark the other person's messages as read now that this user has fetched them
    await Message.updateMany(
      { match: match._id, sender: { $ne: req.user._id }, read: false },
      { read: true },
    );

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

// POST /api/matches/:matchId/messages   Body: { text }
const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Message text can't be empty.",
      });
    }

    if (text.trim().length > 2000) {
      return res.status(400).json({
        message: "Message can't be longer than 2000 characters.",
      });
    }

    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: "Match not found." });
    if (!assertParticipant(match, req.user._id)) {
      return res
        .status(403)
        .json({ message: "You're not part of this conversation." });
    }
    if (match.status !== "active") {
      return res.status(400).json({ message: "This match isn't active yet." });
    }

    const message = await Message.create({
      match: match._id,
      sender: req.user._id,
      text: text.trim(),
    });

    const recipientId =
      String(match.mentee) === String(req.user._id)
        ? match.mentor
        : match.mentee;
    await Notification.create({
      user: recipientId,
      type: "new_message",
      text: `${req.user.name} sent you a message.`,
      relatedMatch: match._id,
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMessages, sendMessage };
