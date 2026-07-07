<div align="center">

<img src="public/icons/icon-512.svg" alt="The Little Things logo" width="120" />

# ✨ The Little Things

**A cozy little app for capturing the tiny moments that make life, life.**

_Doodle a thought. Tag a feeling. Relive it later like a story._

<br />

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)

</div>

---

## 🌸 What is this?

**The Little Things** is a mobile-first journaling app where your entries aren't words — they're **scribbles**. Sketch whatever's on your mind on a soft dotted canvas, tag it with a mood, a thread, and a little note, then watch your memories come back to you as swipeable stories.

It's part sketchbook, part diary, part time capsule. No pressure, no perfection — just the little things.

---

## 🎨 Features

### ✏️ The Canvas
- A calm, dotted drawing surface that feels like a real notebook.
- Full **touch support** — draw naturally with your finger on mobile.
- Adjustable brush colors and sizes via the drawing tools.
- Your scribble is auto-cropped to just what you drew when you save.

### 💾 Saving a Moment
When you save a scribble, you can attach:
- **Moods** 😊 🤩 😎 🥹 🤔 — one or many emoji to capture how you felt.
- **Threads** — freeform tags to group related scribbles together.
- **A description** — the tiny story behind the doodle.

### 🕰️ Three Ways to Wander Back
- **Timeline** — every scribble, newest first, in a clean grid.
- **Vibe** — grouped by emotion. Tap a mood to relive those moments as an **Instagram-style story**.
- **Threads** — each tag lives in its own rounded card, sitting on a bed of soft, looping artistic threads. Tap one to flip through every drawing in that thread, story-style.

### 🔔 Gentle Nudges
- Set a delay (hours / minutes) after which a scribble sends you a **notification**.
- The notification is aesthetic — it shows your drawing, its name, and lovingly prompts you to **add a description or edit** it while the memory is still warm.

### 📁 Save to Your Device
- Optionally link a **device album folder** (via the File System Access API).
- Every scribble you draw is also saved there as a real PNG image.

### 👤 Your Account, Everywhere
- Sign up / log in with a username and password (JWT-secured).
- Scribbles sync to the cloud, so they follow you across devices.
- Draw while logged out too — your local scribbles sync up the moment you log in.

### 📱 Installable (PWA)
- Add it to your home screen on iPhone or Android and it runs full-screen, like a native app.
- Works offline for the things that don't need the server.

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS, React Router |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (hosted on Neon) |
| **Auth** | JWT + bcrypt |
| **Hosting** | Render (static site + web service) |
| **Extras** | vite-plugin-pwa, Workbox service worker |

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
cd server && npm install && cd ..
```

### 2. Set up the database
Create a free PostgreSQL database (e.g. on [Neon](https://neon.tech)) and add a `server/.env` file:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-secret-here
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run everything
```bash
npm run dev:all
```
This starts the frontend on **http://localhost:5173** and the backend on **http://localhost:3001**.

> Prefer separate terminals? Use `npm run dev` (frontend) and `npm run server` (backend).

---

## ☁️ Deployment

The app deploys to **Render** via the included [`render.yaml`](render.yaml) blueprint:

1. Push to GitHub.
2. On Render: **New → Blueprint** → connect this repo → **Apply**.
3. Provide `DATABASE_URL` (your Neon string) when prompted.
4. After the first deploy, set the cross-URLs:
   - Backend `CLIENT_ORIGIN` → your frontend URL
   - Frontend `VITE_API_BASE` → your backend URL + `/api`
5. Redeploy the frontend so it bakes in the API URL. 🎉

---

## 📂 Project Structure

```
src/app/
  pages/           # DrawingPage, HomePage, LoginPage
  components/      # Drawing tools, dialogs, UI kit
  context/         # Auth context
  albumStorage.ts  # Device album (File System Access API)
  api.ts           # Frontend API client
server/
  index.js         # Express app
  db.js            # PostgreSQL pool + schema
  routes/          # auth + scribbles endpoints
```

---

<div align="center">

Made with a little bit of love, for the little things. 💛

</div>