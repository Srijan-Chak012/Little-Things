<div align="center">

<img src="public/icons/icon-512.svg" alt="The Little Things logo" width="120" />

# ✨ The Little Things

**A cozy little app for capturing the tiny moments that make life, life.**

_Doodle a thought. Tag a feeling. Relive it later like a story._

</div>

---

## 🌸 What is this?

**The Little Things** is a simple journaling app where your entries aren't words but they're **scribbles**. Sketch whatever's on your mind on a soft dotted canvas, tag it with a mood, a thread, and a little note, then watch your memories come back to you as swipeable stories.

It's part sketchbook, part diary, part time capsule. No pressure, no perfection — just the little things.

---

## 🎨 Features

### ✏️ The Canvas
- A dotted drawing surface that feels like a real notebook.
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
- **Vibe** — grouped by emotion. Tap a mood to relive those moments.
- **Threads** — each tag lives in its own rounded card, sitting on a bed of soft, looping artistic threads. Tap one to flip through every drawing in that thread.

### 🔔 Gentle Nudges
- Set a delay (hours / minutes) after which a scribble sends you a **notification**.
- The notification shows your drawing, its name, and prompts you to **add a description or edit** it while the memory is still warm.

### 📁 Save to Your Device
- Optionally link a **device album folder**.
- Every scribble you draw is also saved there as a real PNG image.

### 👤 Your Account, Everywhere
- Sign up / log in with a username and password (JWT-secured).
- Scribbles sync to the cloud, so they follow you across devices.
- Draw while logged out too — your local scribbles sync up the moment you log in.

### 📱 Installable (PWA)
- Add it to your home screen on iPhone or Android and it runs full-screen, like a native app.
- Works offline for the things that don't need the server.

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