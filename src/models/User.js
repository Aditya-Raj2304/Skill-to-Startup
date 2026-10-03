const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const reviewSchema = new mongoose.Schema(
  {
    quote: String,
    name: String,
    meta: String,
  },
  { _id: false },
);

const timelineItemSchema = new mongoose.Schema(
  {
    date: String,
    title: String,
    body: String,
  },
  { _id: false },
);

const availabilitySlotSchema = new mongoose.Schema(
  {
    label: String,
    open: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: { type: String, enum: ["mentor", "mentee"], required: true },

    // Shared profile fields
    roleLine: { type: String, default: "",maxlength: 150 }, // e.g. "Systems designer" or "Freelance web designer, 9 years"
    location: { type: String, default: "", maxlength: 100 },
    about: { type: String, default: "", maxlength: 1000 },
    skills: { type: [String], default: [] },

    // Mentor-only fields
    reviews: { type: [reviewSchema], default: [] },
    stats: {
      sessions: { type: Number, default: 0 },
      mentees: { type: Number, default: 0 },
      rating: { type: String, default: "—" },
      years: { type: Number, default: 0 },
    },
    availability: { type: [availabilitySlotSchema], default: [] },
    sessionDetails: {
      format: { type: String, default: "30 min video call" },
      price: { type: String, default: "First session free" },
      responds: { type: String, default: "Under a day" },
    },

    // Mentee-only fields
    timeline: { type: [timelineItemSchema], default: [] },
    focus: {
      focus: { type: String, default: "" },
      stage: { type: String, default: "" },
      lookingFor: { type: String, default: "" },
    },
    progressStats: {
      type: [
        {
          value: String,
          label: String,
        },
      ],
      default: [],
      _id: false,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // assigned mentor, once matched
  },
  { timestamps: true },
);

// Derive "AN"-style initials from the name for the frontend avatar badges
userSchema.virtual("initials").get(function () {
  return this.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
