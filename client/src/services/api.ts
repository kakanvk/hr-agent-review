import { API_BASE_URL, AUTH_KEY } from "@/constants/auth"
import { mapCandidate } from "@/pages/cv-warehouse/map-candidate"
import type { CandidateItem } from "@/pages/cv-warehouse/types"

export async function fetchCandidates(): Promise<CandidateItem[]> {
  const token = localStorage.getItem(AUTH_KEY)
  if (!token) {
    throw new Error("Thiếu token đăng nhập")
  }

  const response = await fetch(`${API_BASE_URL}/api/candidates`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.message || "Không thể tải danh sách ứng viên")
  }

  if (!Array.isArray(payload.data)) {
    return []
  }

  return payload.data.map((item: Record<string, unknown>) => mapCandidate(item))
}
