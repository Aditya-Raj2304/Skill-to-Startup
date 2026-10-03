/**
 * Populates the database with the same demo mentors/mentees the frontend used to show as
 * hardcoded mock data — so the site looks like a real, populated product instead of empty,
 * once you've connected MongoDB Atlas. Safe to re-run: it wipes and recreates these specific
 * demo accounts each time (matched by email), it does not touch any real accounts.
 *
 * Usage:  node seed.js
 * Requires .env with a working MONGODB_URI already set.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const Match = require("./src/models/Match");
const Message = require("./src/models/Message");

const DEMO_PASSWORD = "password123"; // every seeded account uses this — change after testing if you keep them

const mentors = [
  {
    name: "Priya Ramakrishnan",
    email: "priya@demo.skilltostartup.com",
    password: DEMO_PASSWORD,
    role: "mentor",
    roleLine: "Freelance brand & web designer, 9 years",
    location: "Ranchi, Jharkhand",
    about:
      "I've spent nine years building brand and web identities for small businesses across Jharkhand — cafés, tea franchises, first-time founders. I mentor people who already have a craft and need help shaping it into something clients will actually hire, without losing what makes their work theirs.",
    skills: ["Pricing your first offer", "Client-facing web design", "Local business branding", "Freelance positioning"],
    reviews: [
      { quote: "Priya asked me one question about my pricing that changed how I talk to every client since.", name: "Jonah T.", meta: "Mentee since March 2026" },
      { quote: "Practical, not theoretical. She reviewed my actual site and told me exactly what to cut.", name: "Sana D.", meta: "Mentee since January 2026" },
    ],
    stats: { sessions: 42, mentees: 18, rating: "4.9", years: 9 },
    availability: [
      { label: "Mon", open: false }, { label: "Tue", open: true }, { label: "Wed", open: true },
      { label: "Thu", open: false }, { label: "Fri", open: true }, { label: "Sat", open: false },
      { label: "Sun", open: false }, { label: "+more", open: true },
    ],
    sessionDetails: { format: "30 min video call", price: "First session free", responds: "Under a day" },
  },
  {
    name: "Daniel Okafor",
    email: "daniel@demo.skilltostartup.com",
    password: DEMO_PASSWORD,
    role: "mentor",
    roleLine: "Ops & automation mentor, 6 years",
    location: "Nairobi, Kenya",
    about:
      "I help people whose skill is making messy things run smoother turn that into a paid pilot with their first client — from process mapping to the slightly awkward first invoice.",
    skills: ["Workflow design", "Landing your first pilot", "Systems thinking", "Notion & Airtable setup"],
    reviews: [
      { quote: "Daniel mapped my entire onboarding process in one call — I finally saw where I was losing clients.", name: "Wale A.", meta: "Mentee since April 2026" },
    ],
    stats: { sessions: 31, mentees: 14, rating: "4.8", years: 6 },
    availability: [
      { label: "Mon", open: true }, { label: "Tue", open: false }, { label: "Wed", open: true },
      { label: "Thu", open: true }, { label: "Fri", open: false }, { label: "Sat", open: false },
      { label: "Sun", open: false }, { label: "+more", open: true },
    ],
    sessionDetails: { format: "30 min video call", price: "₹800 per session", responds: "Same day" },
  },
  {
    name: "Leila Marchetti",
    email: "leila@demo.skilltostartup.com",
    password: DEMO_PASSWORD,
    role: "mentor",
    roleLine: "Community & workshop facilitator, 5 years",
    location: "Lisbon, Portugal",
    about:
      "I coach people who are ready to teach what they know but freeze up at \"so, what's the offer?\" — turning expertise into a first cohort or workshop people actually pay for.",
    skills: ["Facilitation", "Cohort launches", "Pricing a workshop", "Community building"],
    reviews: [
      { quote: "Leila helped me price my first workshop without undercutting myself.", name: "Tomas R.", meta: "Mentee since May 2026" },
    ],
    stats: { sessions: 27, mentees: 11, rating: "4.95", years: 5 },
    availability: [
      { label: "Mon", open: false }, { label: "Tue", open: true }, { label: "Wed", open: false },
      { label: "Thu", open: true }, { label: "Fri", open: true }, { label: "Sat", open: false },
      { label: "Sun", open: false }, { label: "+more", open: true },
    ],
    sessionDetails: { format: "45 min video call", price: "First session free", responds: "Under a day" },
  },
];

const mentees = [
  {
    name: "Amara Nwosu",
    email: "amara@demo.skilltostartup.com",
    password: DEMO_PASSWORD,
    role: "mentee",
    roleLine: "Systems designer",
    location: "Lagos, Nigeria",
    about:
      "I design internal tools for logistics teams and I'm good at turning messy processes into something people can actually follow. I'm testing whether that same skill is worth paying for outside my day job — one small workshop at a time.",
    skills: ["Process mapping", "Workshop facilitation", "Systems thinking", "Notion & Airtable setup"],
    timeline: [
      { date: "Jul 2026", title: "Ran her first paid workshop", body: "Five people, ninety minutes, one clear before-and-after for each attendee's workflow." },
      { date: "Jun 2026", title: "Talked to five potential customers", body: "Found the same complaint three times: \"I know the fix exists, I just never get to it.\"" },
    ],
    progressStats: [
      { value: "7", label: "days to first test" },
      { value: "5", label: "customer calls" },
      { value: "1", label: "paid workshop" },
      { value: "3", label: "mo. on the path" },
    ],
    focus: { focus: "Workflow audits", stage: "First paying customers", lookingFor: "A mentor in facilitation" },
    mentorEmail: "priya@demo.skilltostartup.com", // seeded as already matched, for demo purposes
  },
  {
    name: "Jonah Turner",
    email: "jonah@demo.skilltostartup.com",
    password: DEMO_PASSWORD,
    role: "mentee",
    roleLine: "Freelance developer",
    location: "Bristol, UK",
    about: "I build small business websites and I'm trying to move from one-off projects to retainers.",
    skills: ["Retainer pricing", "Client onboarding", "Scope management"],
    timeline: [
      { date: "Aug 2026", title: "Signed his first retainer client", body: "Converted a one-off project into an ongoing monthly arrangement." },
    ],
    progressStats: [
      { value: "1", label: "retainer signed" },
      { value: "8", label: "customer calls" },
      { value: "3", label: "service tiers" },
      { value: "4", label: "mo. on the path" },
    ],
    focus: { focus: "Pricing his first retainer", stage: "Converting one-off clients", lookingFor: "A mentor in ops & pricing" },
    mentorEmail: "daniel@demo.skilltostartup.com",
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB — seeding…");

  const seededEmails = [...mentors, ...mentees].map((u) => u.email);
  await User.deleteMany({ email: { $in: seededEmails } });
  await Match.deleteMany({}); // demo matches only — safe since there's no real user data yet
  await Message.deleteMany({});

  const createdMentors = {};
  for (const mentorData of mentors) {
    const mentor = await User.create(mentorData);
    createdMentors[mentor.email] = mentor;
    console.log(`Created mentor: ${mentor.name} (${mentor.email})`);
  }

  for (const menteeData of mentees) {
    const { mentorEmail, ...rest } = menteeData;
    const assignedMentor = createdMentors[mentorEmail];
    const mentee = await User.create({ ...rest, mentor: assignedMentor?._id || null });
    console.log(`Created mentee: ${mentee.name} (${mentee.email})`);

    if (assignedMentor) {
      const match = await Match.create({ mentee: mentee._id, mentor: assignedMentor._id, status: "active" });
      await Message.create({ match: match._id, sender: mentee._id, text: "Hi! Excited to get started." });
      await Message.create({ match: match._id, sender: assignedMentor._id, text: "Welcome! Let's dig into what you're working on." });
      console.log(`  → matched with ${assignedMentor.name}, seeded a starter conversation`);
    }
  }

  console.log("\nDone. All seeded accounts use the password:", DEMO_PASSWORD);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
