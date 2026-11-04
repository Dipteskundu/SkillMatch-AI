<div align="center">

# 🎯 SkillMatch-AI

### AI‑powered hiring & job‑matching platform — from profile to interview, end‑to‑end.

<p>
  <img alt="Status" src="https://img.shields.io/badge/Status-In%20Development-6E56CF?style=for-the-badge" />
  <img alt="Node" src="https://img.shields.io/badge/Node-26.x-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=0B1B2B" />
  <img alt="Express" src="https://img.shields.io/badge/Express.js-API-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%26%20Realtime-FFCA28?style=for-the-badge&logo=firebase&logoColor=000" />
  <img alt="License" src="https://img.shields.io/badge/License-TBD-lightgrey?style=for-the-badge" />
</p>

<p>
  <a href="#overview">Overview</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#project-structure">Project Structure</a>
</p>

</div>


---
## Live Link: https://skillmatchai-phi.vercel.app

<a id="overview"></a>
## 📌 Overview

**SkillMatch AI** is a full‑stack, AI‑assisted hiring platform that connects **candidates**, **recruiters**, and **admins** through a structured hiring pipeline.

It helps solve common hiring pain points:
- Candidates struggle to understand **what skills to improve** and **why a job is a good match**
- Recruiters need a cleaner workflow for **posting jobs**, **screening**, and **progressing candidates**
- Teams want **real‑time updates** and a consistent, role‑based experience

---

<a id="features"></a>
## ✨ Features

### 👤 Candidate Experience
- Create a profile, upload resume, and manage skills
- Browse jobs, apply, and track application progress
- Save jobs for later
- Skill tests & communication assessments (AI‑assisted)
- Skill‑gap insights and learning guidance (where enabled)

### 🧑‍💼 Recruiter Experience
- Post jobs and manage listings
- Review applicants and move them through the pipeline
- Assign tasks / tests and schedule interviews (where enabled)

### 🛡️ Admin Experience
- Approve/reject job posts
- Manage users and monitor platform activity (where enabled)

### 🤖 AI & Automation (Backend)
- Gemini‑powered question generation & answer evaluation (where enabled)
- Resume parsing support (PDF/DOCX) for structured extraction (where enabled)

---

<a id="tech-stack"></a>
## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| 🎨 Frontend | Next.js (App Router), React, Tailwind CSS |
| 🧠 Backend | Node.js, Express.js |
| 🗄️ Database | MongoDB (Atlas) |
| 🔐 Auth | Firebase Authentication |
| 🔄 Realtime | Firebase Realtime Database |
| 🧰 Tooling | ESLint, npm |
| 🚀 Deploy | Vercel (frontend + backend) |

---

## 📸 Screenshots / Demo

> Add your screenshots and demo links here to make the repo shine.

| Preview | Description |
|---|---|
| `public/screenshots/home.png` | Landing / Home |
| `public/screenshots/dashboard.png` | Dashboard |
| `public/screenshots/jobs.png` | Job Listing + Apply Flow |
| `public/screenshots/recruiter.png` | Recruiter Panel |

**Demo:** _Coming soon_  
**Video Walkthrough:** _Coming soon_

---

<a id="installation"></a>
## ⚙️ Installation

### ✅ Prerequisites

- Node.js **26.x**
- MongoDB Atlas connection string (or your MongoDB URI)
- Firebase project (Auth + Realtime Database)
- (Optional) Gemini API key for AI routes

---

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd "<your-repo-folder>"
```

---

### 2) Backend setup (Express API)

```bash
cd SkillMatch-AI-Server
cp .env.example .env
npm ci
npm start
```

Backend defaults to: `http://localhost:5000`

Required env (see `SkillMatch-AI-Server/.env.example`):
- `MONGODB_URI`
- `MONGO_DB_NAME`
- `CORS_ORIGIN`
- (Optional) `GEMINI_API_KEY`
- (Optional) Firebase Admin (for protected routes + realtime notifications):
  - `FIREBASE_SERVICE_ACCOUNT_JSON` (recommended) or `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`
  - `FIREBASE_DATABASE_URL` (optional)

---

### 3) Frontend setup (Next.js)

```bash
cd ../SkillMatch-AI
cp .env.example .env.local
npm ci
npm run dev
```

Frontend defaults to: `http://localhost:3000`

Required env (see `SkillMatch-AI/.env.example`):
- `NEXT_PUBLIC_API_BASE_URL` (or `NEXT_PUBLIC_API_LOCAL` for local API)
- `NEXT_PUBLIC_FIREBASE_*`
- (Optional) `NEXT_PUBLIC_IMGBB_API_KEY`

---

<a id="usage"></a>
## ▶️ Usage

### 🧭 Run locally (two terminals)

**Terminal A — Backend**
```bash
cd SkillMatch-AI-Server
npm start
```

**Terminal B — Frontend**
```bash
cd SkillMatch-AI
npm run dev
```

Then open: `http://localhost:3000`

---

<a id="deployment"></a>
## 🚀 Deployment (Vercel)

This repo is designed to deploy **frontend** and **backend** as **two separate Vercel projects**.

### 1) Deploy the backend
1. Create a new Vercel project with **Root Directory** = `SkillMatch-AI-Server`.
2. Add env vars from `SkillMatch-AI-Server/.env.example`.
3. Deploy — the backend is routed via `SkillMatch-AI-Server/vercel.json`.

### 2) Deploy the frontend
1. Create a new Vercel project with **Root Directory** = `SkillMatch-AI`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL.
3. Update backend `CORS_ORIGIN` to include your frontend domain.

---

### 🧑‍🤝‍🧑 Roles (at a glance)

| Role | What they do |
|---|---|
| 👤 Candidate | Browse jobs, apply, complete tests/tasks, attend interviews |
| 🧑‍💼 Recruiter | Post jobs, review candidates, manage pipeline |
| 🛡️ Admin | Approve job posts, manage users, oversee platform |

---

<a id="project-structure"></a>
## 📂 Project Structure

```text
./
├─ SkillMatch-AI/                    # Frontend (Next.js)
│  ├─ public/
│  ├─ src/
│  │  └─ app/                      # App Router routes + UI
│  │     ├─ (dashboard)/
│  │     ├─ jobs/
│  │     ├─ resume/
│  │     ├─ saved-jobs/
│  │     ├─ skill-gap-analysis/
│  │     ├─ skill-test/
│  │     └─ ...
│  ├─ .env.example
│  ├─ next.config.mjs
│  └─ package.json
└─ SkillMatch-AI-Server/             # Backend (Express)
   ├─ api/                         # Vercel serverless entry (if used)
   ├─ config/
   ├─ controllers/
   ├─ middleware/
   ├─ models/
   ├─ routes/
   ├─ services/                    # AI services (Gemini) + helpers
   ├─ .env.example
   ├─ vercel.json
   └─ index.js
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo and create a new branch: `feature/your-feature-name`
2. Keep changes focused (one feature/fix per PR)
3. Run checks before submitting:
   - Frontend: `npm run lint`
4. Open a PR with a clear description + screenshots (if UI changes)

---

## 📄 License

This project does not currently include a license file.  
Add a `LICENSE` to define reuse and contribution terms (e.g., MIT, Apache-2.0).

---

## 👨‍💻 Author

- **Name:** Diptes Kundu
- **Email:** dipteskundu6@gmail.com
- **GitHub:** https://github.com/Dipteskundu
- **LinkedIn:** https://www.linkedin.com/in/diptes-kundu
