const Match = require("../models/Match");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Message = require("../models/Message");

// POST /api/matches  — mentee sends a request to a mentor. Body: { mentorId }
const requestMentor = async (req, res, next) => {
  try {
    if (req.user.role !== "mentee") {
      return res
        .status(403)
        .json({ message: "Only mentees can request a mentor." });
    }
    const { mentorId } = req.body;
    const mentor = await User.findOne({ _id: mentorId, role: "mentor" });
    if (!mentor) return res.status(404).json({ message: "Mentor not found." });

    const match = await Match.create({
      mentee: req.user._id,
      mentor: mentorId,
      status: "pending",
    });

    await Notification.create({
      user: mentorId,
      type: "match_requested",
      text: `${req.user.name} would like to connect with you.`,
      relatedMatch: match._id,
    });

    res.status(201).json({ match });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "You've already requested this mentor." });
    }
    next(error);
  }
};

// GET /api/matches  — list the logged-in user's matches (mentor sees mentees, mentee sees mentor)
// Each match is enriched with a lastMessage preview and unreadCount so the frontend doesn't
// need a separate request per conversation just to render the list.
const listMyMatches = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "mentor"
        ? { mentor: req.user._id }
        : { mentee: req.user._id };
    const matches = await Match.find(filter)
      .populate(
        "mentee",
        "name roleLine location skills focus timeline progressStats initials",
      )
      .populate(
        "mentor",
        "name roleLine location skills stats availability sessionDetails initials",
      )
      .sort({ updatedAt: -1 })
      .lean();

    const enriched = await Promise.all(
      matches.map(async (match) => {
        const lastMessage = await Message.findOne({ match: match._id })
          .sort({ createdAt: -1 })
          .lean();
        const unreadCount = await Message.countDocuments({
          match: match._id,
          sender: { $ne: req.user._id },
          read: false,
        });
        return {
          ...match,
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                sentByMe: String(lastMessage.sender) === String(req.user._id),
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      }),
    );

    res.json({ matches: enriched });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/matches/:id  — mentor accepts or declines. Body: { status: "active" | "declined" }
const respondToMatch = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "declined"].includes(status)) {
      return res
        .status(400)
        .json({ message: "status must be 'active' or 'declined'." });
    }

    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found." });
    if (String(match.mentor) !== String(req.user._id)) {
      return res.status(403).json({
        message: "Only the requested mentor can respond to this match.",
      });
    }

    if (match.status !== "pending") {
      return res.status(400).json({
        message: "This match has already been responded to.",
      });
    }

    if (match.status !== "pending") {
      return res.status(400).json({
        message: "This match has already been responded to.",
      });
    }

    match.status = status;
    await match.save();

    if (status === "active") {
      await User.findByIdAndUpdate(match.mentee, { mentor: match.mentor });
    }

    await Notification.create({
      user: match.mentee,
      type: status === "active" ? "match_accepted" : "match_declined",
      text:
        status === "active"
          ? `${req.user.name} accepted your request — say hello!`
          : `${req.user.name} isn't able to take on new mentees right now.`,
      relatedMatch: match._id,
    });

    res.json({ match });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestMentor, listMyMatches, respondToMatch };
