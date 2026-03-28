You are a senior backend engineer.

Build a Node.js backend for an AI HR Screening Agent system.

---

# 🎯 Core Principles (VERY IMPORTANT)

- Keep architecture SIMPLE and CLEAN
- Avoid overengineering
- Prioritize readability and maintainability
- Use clear folder structure
- Use async/await (no callbacks)
- Use consistent naming conventions

---

# 🧱 Tech Stack

- Node.js (Express)
- MongoDB
- Mongoose
- more

---

# 📁 Folder Structure (STRICT)

Use this structure:

src/
  config/
  controllers/
  services/
  models/
  routes/
  middlewares/
  utils/
  prompts/
    cv-evaluation.md          # Prompt Gemini đánh giá CV (placeholder {{SETTINGS_SUMMARY}}, {{CRITERIA_LIST}}, {{CV_TEXT}})
    build-cv-evaluation-prompt.js

app.js

---

## Prompt LLM (Gemini — đánh giá CV)

- Template nằm tại `server/src/prompts/cv-evaluation.md`; **không** nhét toàn bộ prompt dài trong `ai.service.js`.
- Ghép nội dung gửi API qua `buildCvEvaluationPrompt({ cvText, settings })` trong `build-cv-evaluation-prompt.js`.
- `settings` gồm `criteria` (Mongoose subdocs: `name`, `description`, `enabled`), `autoRejectEnabled`, `autoPassEnabled` — đều được đưa vào prompt để model biết ngữ cảnh người dùng.
- Debug: bật `GEMINI_DEBUG=true` để log `prompt-meta` + `promptPreview`; chỉnh prompt liên tục với `GEMINI_PROMPT_HOT_RELOAD=true` (đọc lại file `.md` mỗi request).

---

# 🧠 Architecture Rules

## 1. Controller Layer

- Only handle:
  - req
  - res
  - calling service

DO NOT:
- write business logic here

---

## 2. Service Layer (IMPORTANT)

- All business logic must be here
- Handle:
  - AI logic
  - rule logic
  - data processing

---

## 3. Model Layer

- Define Mongoose schemas
- Keep simple and clean

---

## 4. Routes

- Only define endpoints
- Map to controller

---

## 5. Middleware

- auth middleware (JWT)
- error handling middleware

---

# 🔐 Authentication

- Use simple JWT
- After Google login:
  - create/find user
  - return JWT

Middleware:

- verify token
- attach user to req

req.user = { id, email }

---

# 🗄️ Database Rules

## All data MUST include userId

Example:

Candidate:
- userId (required)

Settings:
- userId (required, unique)

---

# ❗ Query Rules (VERY IMPORTANT)

Every query MUST filter by userId:

Example:

Candidate.find({ userId: req.user.id })

NEVER return global data

---

# ⚙️ Feature Modules

---

## 1. User

- create/find by googleId
- return JWT

---

## 2. Candidate (CORE)

Service responsibilities:

- save CV data
- call AI (Gemini)
- apply rule logic

---

## 3. Settings

- get user settings
- update settings
- create default settings on first login

---

# 🤖 AI Integration (Gemini)

Create a dedicated service:

services/ai.service.js

Responsibilities:

- send CV text to Gemini
- return structured JSON

---

## AI Response Handling

- Always parse JSON safely
- Use try/catch
- If invalid → fallback safe response

---

# 🧠 Rule Engine (IMPORTANT)

Inside candidate service:

Example:

if (score < 60) reject  
if (!hasRequiredSkill) reject  
if (experience < minExperience) reject  

---

# 🧩 Utilities

Create reusable utils:

- parseCV (pdf → text)
- formatResponse
- errorHandler

---

# 🚨 Error Handling

- Use centralized error middleware
- Return consistent format:

{
  message: "",
  error: ""
}

---

# 🧪 Code Style

- Use ES modules or CommonJS (pick ONE, stay consistent)
- Use async/await
- Keep functions small
- Avoid deeply nested logic

---

# 📦 Example Flow (IMPORTANT)

POST /candidates/analyze:

Controller:
- get file / email data
- call service

Service:
- extract text
- call AI
- apply rules
- save DB

Return result

---

# ⚠️ Constraints

- No microservices
- No repository pattern
- No complex abstractions
- No over-layering

---

# 🎯 Goal

Produce a backend that is:

- Easy to read
- Easy to debug
- Easy to extend
- Suitable for a small MVP project

Focus on clarity over complexity.