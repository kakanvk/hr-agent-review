You are a senior fullstack engineer.

Build a fullstack application called:

# 🧠 AI HR Screening Agent – Automated CV Evaluation System

---

# 🎯 Goal

The system connects to Gmail, retrieves CV emails with PDF attachments, analyzes candidates using Gemini API, and provides a dashboard for HR to review, filter, and optionally automate decisions.

The system MUST support multiple users (multi-tenant). Each user logs in with their own Google account and only sees their own data.

---

# 🧱 Tech Stack (STRICT)

## Backend:
- Node.js (Express)
- MongoDB (use MongoDB for easier setup)
- Mongoose ORM

## Frontend:
- React (Vite)
- TailwindCSS
- shadcn/ui

## AI:
- Google Gemini API

---

# 🔐 Multi-User Requirement (CRITICAL)

## 1. User Model

Create a "users" collection:

- googleId (string, unique)
- email
- name
- avatar
- accessToken (optional)
- createdAt

---

## 2. Data Ownership

All data MUST belong to a user:

### candidates
- userId (ObjectId, required)

### settings
- userId (ObjectId, required, unique per user)

---

## 3. Authentication Flow

- User logs in via Google OAuth
- Backend:
  - find or create user in DB using googleId
- Return JWT (simple, no refresh token needed)

---

## 4. Authorization

ALL APIs must filter by userId:

Examples:

- GET /candidates → only current user data
- GET /settings → only current user data

NEVER return shared/global data

---

## 5. Middleware

Create auth middleware:

- Decode JWT
- Attach user to request

Example:
req.user = { id, email }

---

## 6. Gmail Isolation

Each user uses their own Gmail access token

---

## 7. Default Behavior

On first login:
- create default settings for user

---

# ⚙️ Core Features

---

## 1. Gmail Integration

- Use Gmail API with OAuth2
- Fetch emails with:
  - has:attachment
  - filename: pdf

Extract:
- subject
- sender
- snippet
- attachmentId

---

## 2. CV Processing

- Download PDF attachment
- Extract text using pdf-parse
- If fails → fallback to email snippet

---

## 3. AI Agent (CRITICAL)

Pipeline:

extract CV → analyze → score → decision → generate reasoning

---

## Gemini Prompt

Return STRICT JSON:

{
  "name": "",
  "skills": [],
  "experience_years": 0,
  "strengths": [],
  "weaknesses": [],
  "score": 0,
  "decision": "pass | reject",
  "reason": ""
}

---

## 4. Rule-Based Layer (IMPORTANT)

Combine AI + rule logic:

Examples:
- If score < 60 → reject
- If missing required skills → reject
- If experience < minExperience → reject

Rules must be configurable from DB

---

## 4.1 Campaign Management (NEW - CRITICAL)

The system must support multi-campaign workflow for each user:

- Each user can create multiple campaigns.
- Each campaign has:
  - name
  - description
  - startDate
  - endDate
  - isEnabled (on/off)
  - autoRejectEnabled
  - autoPassEnabled
- Each candidate/CV belongs to one campaign via `campaignId`.
- Campaign list screen must support:
  - create
  - update
  - delete
  - list campaign stats (`totalApply`, `totalPass`, `totalReject`)
- Campaign detail screen must show:
  - automation toggles (auto reject / auto pass)
  - CV list split in 2 tabs: pass / reject

All campaign queries must be filtered by `userId`.

---

# 🗄️ Database Design

## users
- googleId
- email
- name
- avatar
- accessToken
- createdAt

## candidates
- userId
- name
- email
- skills
- experience_years
- strengths
- weaknesses
- score
- decision
- reason
- raw_cv_text
- createdAt

## settings
- userId
- requiredSkills: string[]
- minExperience: number
- autoReject: boolean
- autoPass: boolean

## campaigns
- userId
- name
- description
- startDate
- endDate
- isEnabled
- autoRejectEnabled
- autoPassEnabled

## candidates (updated)
- ...existing fields...
- campaignId

---

# 🔌 Backend APIs

## Auth
- Google OAuth login

---

## Emails
- GET /emails → fetch Gmail emails

---

## Candidates
- POST /analyze → process CV + save DB
- GET /candidates → list (filter by userId)
- GET /candidates/:id → detail (check ownership)

---

## Settings
- GET /settings
- PUT /settings

---

# 🖥️ Frontend UI

---

## Dashboard
- total CV
- pass / reject count
- average score

---

## Candidate List
- table:
  - name
  - score
  - decision (badge)
- click row → detail

---

## Candidate Detail
- strengths
- weaknesses
- skills
- score
- decision
- buttons:
  - approve
  - reject

---

## Settings Page
- required skills (multi input)
- min experience
- toggle autoReject
- toggle autoPass

---

# 🎨 UI Requirements

Use shadcn/ui components:

- table
- card
- badge
- button
- dialog

Design:
- clean dashboard
- responsive

---

# 🤖 Automation Behavior

If autoReject = true:
- automatically mark candidate as rejected

If autoPass = true:
- mark as passed

(No need to send real emails)

---

# ⚠️ Constraints

- Keep code SIMPLE
- No microservices
- No Docker
- No complex auth system
- No refresh token
- Focus on MVP working demo

---

# 🎯 Deliverables

Generate:

1. Backend folder structure
2. Frontend folder structure
3. Key code files:
   - Express server
   - Mongo models
   - Gemini integration
   - Gmail fetch logic (mockable)
4. Frontend pages with UI

---

# ⚡ Bonus (Optional)

- Add mock mode if Gmail fails
- Add loading states
- Add error handling

---

# 🔑 Environment Variables

- GEMINI_API_KEY
- MONGO_URI
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

---

# 🚫 Avoid

- Overengineering
- Complex architecture
- Unnecessary abstractions

---

# 🎯 Final Goal

Deliver a working MVP:

- Multi-user
- Gmail CV ingestion
- AI-based evaluation
- Dashboard visualization
- Rule-based decision system

Focus on speed, simplicity, and clarity.