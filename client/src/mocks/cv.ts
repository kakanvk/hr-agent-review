import type { CvItem } from "@/types/app"

export const mockCvList: CvItem[] = [
  {
    id: "cv-1",
    candidateName: "Nguyễn Minh Anh",
    email: "minhanh@example.com",
    score: 81,
    decision: "pass",
    skills: ["React", "TypeScript", "Node.js"],
    strengths: ["Frontend architecture tốt", "Có kinh nghiệm mentoring"],
    weaknesses: ["Thiếu cloud deployment thực tế"],
    summary: "Ứng viên phù hợp vị trí Frontend Senior.",
  },
  {
    id: "cv-2",
    candidateName: "Trần Gia Bảo",
    email: "giabao@example.com",
    score: 62,
    decision: "reject",
    skills: ["Java", "Spring Boot"],
    strengths: ["Nền tảng backend ổn"],
    weaknesses: ["Chưa đáp ứng stack hiện tại", "English giao tiếp trung bình"],
    summary: "Cân nhắc cho vị trí backend intern thay vì role hiện tại.",
  },
  {
    id: "cv-3",
    candidateName: "Lê Hoàng Phúc",
    email: "hoangphuc@example.com",
    score: 76,
    decision: "pass",
    skills: ["Python", "SQL", "Data Analysis"],
    strengths: ["Đọc hiểu requirement nhanh", "Báo cáo rõ ràng"],
    weaknesses: ["Kinh nghiệm FE còn hạn chế"],
    summary: "Phù hợp role data analyst, cần interview vòng 2.",
  },
]
