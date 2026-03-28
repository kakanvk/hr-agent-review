# Project Context - AI HR Screening Agent

## 1) Mục tiêu dự án
- Xây dựng MVP fullstack cho hệ thống lọc CV tự động.
- Hướng đến luồng tổng thể: Gmail ingestion -> AI phân tích CV -> rule-based decision -> dashboard cho HR.
- Ưu tiên: đơn giản, dễ đọc, dễ debug, dễ mở rộng.

## 2) Tech stack (đang dùng)
- Frontend: React + Vite + TypeScript + TailwindCSS + shadcn/ui.
- Backend: Node.js + Express + MongoDB + Mongoose.
- AI (dự kiến): Gemini API.

## 3) Trạng thái hiện tại (đã xong)

### Frontend
- Đã tạo layout có sidebar thu gọn/mở rộng.
- Menu hiện có:
  - Dashboard
  - Kho CV
  - Chiến dịch
  - Cài đặt
- Đã tách các page lớn theo feature-folder:
  - `pages/email-list/*`
  - `pages/settings/*`
  - `pages/campaigns/*`
- Đã kết nối API thật cho:
  - Gmail list
  - Settings CRUD
  - Campaign CRUD + campaign detail

### Backend
- Đã setup project server có cấu trúc theo rule:
  - `src/config`
  - `src/controllers`
  - `src/services`
  - `src/models`
  - `src/routes`
  - `src/middlewares`
  - `src/utils`
- Entry: `server/app.js`.
- Đã có:
  - Kết nối Mongo: `src/config/db.js`
  - Error handling trung tâm: `src/middlewares/error.middleware.js`
  - Auth middleware JWT: `src/middlewares/auth.middleware.js`
  - Models: `User`, `Candidate`, `Setting`, `Campaign`
  - Services: `auth`, `candidate`, `settings`, `gmail`, `campaign`, `ai` (mock placeholder)
  - Controllers + routes cơ bản
- API khung đã có:
  - `POST /api/auth/google`
  - `POST /api/candidates/analyze`
  - `GET /api/candidates`
  - `GET /api/candidates/:id`
  - `GET /api/settings`
  - `PUT /api/settings`
  - `GET /api/campaigns`
  - `POST /api/campaigns`
  - `GET /api/campaigns/:id`
  - `PATCH /api/campaigns/:id`
  - `DELETE /api/campaigns/:id`
- Cấu trúc `settings` hiện tại:
  - `userId`
  - `criteria`: danh sách tiêu chí dạng `{ name, description }`
  - `autoRejectEnabled`, `autoPassEnabled`
- Cấu trúc `campaign` hiện tại:
  - `userId`
  - `name`, `description`
  - `startDate`, `endDate`
  - `isEnabled`
  - `autoRejectEnabled`, `autoPassEnabled`
- Cấu trúc `candidate` cập nhật:
  - có thêm `campaignId` để gán CV vào chiến dịch cụ thể

## 4) Biến môi trường
- File mẫu: `server/.env.example`
- Biến hiện có:
  - `PORT`
  - `MONGO_URI`
  - `JWT_SECRET`
  - `GEMINI_API_KEY`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

## 5) Cách chạy local

### Frontend
- `cd client`
- `pnpm dev`

### Backend
- `cd server`
- Tạo `.env` từ `.env.example`
- `npm run dev`

> Ghi chú: Frontend (`client`) dùng `pnpm`, Backend (`server`) đang dùng `npm`.

## 6) Nguyên tắc kỹ thuật cần giữ
- Controller chỉ xử lý req/res, không nhúng business logic.
- Service chứa business logic.
- Mọi query dữ liệu nghiệp vụ cần filter theo `userId`.
- Giữ code đơn giản, tránh overengineering.

## 7) Backlog ưu tiên tiếp theo
- Tích hợp Gemini thật trong `ai.service`.
- Tích hợp Gmail API (có mock mode fallback).
- Kết nối FE-BE cho dashboard, kho CV (hiện vẫn mock).
- Bổ sung flow ingest/analyze CV theo `campaignId` từ UI.
- Bổ sung validation request (zod/joi hoặc middleware tương đương).
- Viết test cơ bản cho service quan trọng (candidate + rules).

## 8) Lưu ý maintain
- Mọi thay đổi lớn cần update lại file context này.
- Nếu thay đổi endpoint/flow, cập nhật đồng bộ:
  - routes
  - service
  - frontend consume API
  - tài liệu context
