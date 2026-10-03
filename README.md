# Skill to Startup

A mentor/mentee platform. Frontend (static HTML/CSS/JS) and backend (Node.js + Express +
MongoDB) live together in this one folder.

## What's what

index.html, profile.html, signin.html, signup.html, ← frontend pages
mentor-dashboard.html, mentor-profile.html,
privacy-policy.html, terms-of-service.html
css/, js/, img/ ← frontend assets
src/, server.js, seed.js ← backend (Express API)
package.json ← backend dependencies

The frontend is plain static files — no build step. The backend is a normal Node/Express
app that happens to sit in the same folder.

## 1. Run the backend

bash
npm install
cp .env.example .env

Fill in `.env`:

- `MONGODB_URI` — your MongoDB Atlas connection string (see below)
- `JWT_SECRET` — any long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `GEMINI_API_KEY` — free key from aistudio.google.com/apikey, powers Mira's chat
- `CLIENT_ORIGINS` — wherever you're opening the frontend from (e.g. `http://127.0.0.1:5500` for VS Code Live Server)

Then:
bash
npm run dev

You should see `MongoDB connected: ...`. Visit `http://localhost:5000/api/health` to confirm.

Populate it with demo mentors/mentees so the site isn't empty:
bash
node seed.js

## 2. Open the frontend

Just open `index.html` directly, or serve the folder with something like VS Code's Live
Server extension. `js/scripts.js` points at `http://localhost:5000` (the `API_BASE`
constant near the top) — update that one line once the backend is deployed somewhere real.

## 3. Setting up MongoDB Atlas (the database itself)

1. Sign up free at **cloud.mongodb.com**
2. **Build a Database → Free (M0)** → pick a provider/region → Create
3. **Database Access** → create a username/password for your app
4. **Network Access** → Allow Access from Anywhere (0.0.0.0/0) for development
5. **Connect → Drivers** → copy the `mongodb+srv://...` string, swap in your real password,
   add a database name before the `?` (e.g. `/skill-to-startup`)
6. Paste that into `.env` as `MONGODB_URI`

That's it — no manual table/collection creation needed, MongoDB creates them automatically
the first time something is saved.

## 4. Deployment

- **Frontend + backend together (one Vercel project)**: the included `vercel.json` routes
  `/api/*` to the Express server and everything else to the static files. Run `vercel deploy`
  from this folder.
- **Separately** (often simpler): deploy the HTML/CSS/JS files to any static host
  (Netlify, GitHub Pages, Vercel), and the backend to something built for a persistent
  Node process (Render, Railway, AWS Elastic Beanstalk/EC2). Then update `API_BASE` in
  `js/scripts.js` and `CLIENT_ORIGINS` in `.env` to match wherever each one ends up.
- **Database**: MongoDB Atlas, already hosted — nothing extra to deploy.

## API reference

| Method   | Route                            | Auth                          | Purpose                       |
| -------- | -------------------------------- | ----------------------------- | ----------------------------- |
| POST     | `/api/auth/signup`               | —                             | Create an account             |
| POST     | `/api/auth/login`                | —                             | Sign in                       |
| GET      | `/api/auth/me`                   | any                           | Current user                  |
| GET      | `/api/mentors`                   | —                             | Public mentor directory       |
| GET      | `/api/mentors/:id`               | —                             | One mentor's public profile   |
| PUT      | `/api/mentors/me`                | mentor                        | Edit own profile              |
| GET      | `/api/mentees/:id`               | mentee (self) or their mentor | One mentee's profile          |
| PUT      | `/api/mentees/me`                | mentee                        | Edit own profile              |
| POST     | `/api/matches`                   | mentee                        | Request a mentor              |
| GET      | `/api/matches`                   | any                           | List your matches             |
| PATCH    | `/api/matches/:id`               | mentor                        | Accept/decline a request      |
| GET/POST | `/api/matches/:matchId/messages` | participant                   | Conversation                  |
| GET      | `/api/notifications`             | any                           | Your notifications            |
| PATCH    | `/api/notifications/:id/read`    | any                           | Mark as read                  |
| POST     | `/api/mira/chat`                 | any                           | Gemini-powered chat with Mira |
