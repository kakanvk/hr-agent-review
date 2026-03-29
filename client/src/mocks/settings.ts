import type { Criterion } from "@/types/app"

export const defaultCriteria: Criterion[] = [
  {
    id: "criterion-1",
    title: "Bắt buộc có TypeScript",
    description: "Ưu tiên ứng viên đã làm dự án TypeScript trên 1 năm.",
    enabled: true,
  },
  {
    id: "criterion-2",
    title: "Kinh nghiệm từ 2 năm",
    description: "Loại nếu tổng năm kinh nghiệm < 2.",
    enabled: true,
  },
  {
    id: "criterion-3",
    title: "Tiếng Anh giao tiếp",
    description: "Đánh dấu cần review thủ công nếu CV không thể hiện rõ.",
    enabled: false,
  },
]
