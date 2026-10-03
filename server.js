require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const { errorHandler, notFound } = require("./src/middleware/errorHandler");

const authRoutes = require("./src/routes/authRoutes");
const mentorRoutes = require("./src/routes/mentorRoutes");
const menteeRoutes = require("./src/routes/menteeRoutes");
const matchRoutes = require("./src/routes/matchRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const miraRoutes = require("./src/routes/miraRoutes");

connectDB();

const app = express();

app.use(
  express.static(__dirname, {
    dotfiles: "ignore",
    index: "index.html",
  }),
);

const allowedOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SkillBridge API is running successfully 🚀",
    status: "ok",
  });
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/mentees", menteeRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/mira", miraRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // exported so it can also be used as a Vercel/Netlify serverless function
