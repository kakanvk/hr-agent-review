import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BriefcaseBusiness,
  FileText,
  SlidersHorizontal,
  UserCheck,
  UserX,
  Users,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { API_BASE_URL, AUTH_KEY } from "@/constants/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type CampaignCandidate = {
  _id: string
  name: string
  email: string
  score: number
  decision: "pass" | "reject"
  createdAt: string
}

type CampaignDetail = {
  id: string
  name: string
  description: string
  isEnabled: boolean
  autoRejectEnabled: boolean
  autoPassEnabled: boolean
  totalApply: number
  totalPass: number
  totalReject: number
  passCandidates: CampaignCandidate[]
  rejectCandidates: CampaignCandidate[]
}

function mapApiCandidate(raw: Record<string, unknown>): CampaignCandidate {
  const created = raw.createdAt
  let createdAt = ""
  if (typeof created === "string") {
    createdAt = created
  } else if (created && typeof created === "object" && "$date" in (created as object)) {
    createdAt = String((created as { $date?: string }).$date ?? "")
  }

  return {
    _id: String(raw._id ?? ""),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    score: Number(raw.score) || 0,
    decision: raw.decision === "pass" ? "pass" : "reject",
    createdAt,
  }
}

function normalizeCampaignDetail(raw: unknown): CampaignDetail | null {
  if (!raw || typeof raw !== "object") {
    return null
  }
  const o = raw as Record<string, unknown>
  const id = String(o.id ?? "")
  if (!id) {
    return null
  }

  const passRaw = Array.isArray(o.passCandidates) ? o.passCandidates : []
  const rejectRaw = Array.isArray(o.rejectCandidates) ? o.rejectCandidates : []

  return {
    id,
    name: String(o.name ?? ""),
    description: String(o.description ?? ""),
    isEnabled: Boolean(o.isEnabled),
    autoRejectEnabled: Boolean(o.autoRejectEnabled),
    autoPassEnabled: Boolean(o.autoPassEnabled),
    totalApply: Number(o.totalApply) || 0,
    totalPass: Number(o.totalPass) || 0,
    totalReject: Number(o.totalReject) || 0,
    passCandidates: passRaw.map((item) =>
      mapApiCandidate(typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {}),
    ),
    rejectCandidates: rejectRaw.map((item) =>
      mapApiCandidate(typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {}),
    ),
  }
}

export function CampaignDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<CampaignDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"pass" | "reject">("pass")

  const getTokenOrThrow = () => {
    const token = localStorage.getItem(AUTH_KEY)
    if (!token) {
      throw new Error("Thiếu token đăng nhập. Vui lòng đăng nhập lại.")
    }
    return token
  }

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setError("Thiếu ID chiến dịch")
      setDetail(null)
      setIsLoading(false)
      return
    }

    setDetail(null)
    setIsLoading(true)
    setError("")

    try {
      const token = getTokenOrThrow()
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.message || "Không thể tải chi tiết chiến dịch")
      }
      const normalized = normalizeCampaignDetail(payload.data)
      if (!normalized) {
        throw new Error("Dữ liệu chiến dịch không hợp lệ")
      }
      setDetail(normalized)
    } catch (err) {
      setDetail(null)
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết chiến dịch")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const updateAutomation = async (
    key: "isEnabled" | "autoRejectEnabled" | "autoPassEnabled",
    value: boolean,
  ) => {
    if (!id || !detail) {
      return
    }

    setDetail((prev) => (prev ? { ...prev, [key]: value } : prev))
    try {
      const token = getTokenOrThrow()
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: value }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.message || "Không thể lưu cấu hình chiến dịch")
      }
      toast.success("Đã lưu cấu hình chiến dịch")
    } catch (err) {
      setDetail((prev) => (prev ? { ...prev, [key]: !value } : prev))
      toast.error(err instanceof Error ? err.message : "Không thể lưu cấu hình chiến dịch")
    }
  }

  const currentCandidates = useMemo(() => {
    if (!detail) {
      return []
    }
    return activeTab === "pass" ? detail.passCandidates : detail.rejectCandidates
  }, [activeTab, detail])

  const automationItems = detail
    ? [
      {
        key: "isEnabled" as const,
        title: "Trạng thái chiến dịch",
        description: "Bật để chiến dịch hoạt động.",
        enabled: detail.isEnabled,
      },
      {
        key: "autoRejectEnabled" as const,
        title: "Tự động loại",
        description: "Áp dụng quy tắc loại tự động khi điểm thấp.",
        enabled: detail.autoRejectEnabled,
      },
      {
        key: "autoPassEnabled" as const,
        title: "Tự động đạt",
        description: "Cho phép đánh dấu đạt theo rule tự động.",
        enabled: detail.autoPassEnabled,
      },
    ]
    : []

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/campaigns")} className="gap-2">
          <ArrowLeft className="size-4" />
          Danh sách chiến dịch
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-9 w-64 max-w-full" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        </div>
      ) : detail ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0 space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">{detail.name}</h2>
                <p className="mt-2 text-pretty text-sm text-muted-foreground">
                  {detail.description?.trim() ? detail.description : "Chưa có mô tả cho chiến dịch này."}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
                      <Users className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Tổng CV</p>
                      <p className="text-lg font-semibold tabular-nums">{detail.totalApply}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                      <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Đạt</p>
                      <p className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {detail.totalPass}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <UserX className="size-5 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Loại</p>
                      <p className="text-lg font-semibold tabular-nums text-destructive">{detail.totalReject}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FileText className="size-4 shrink-0" />
                  Ứng viên theo chiến dịch
                </CardTitle>
                <CardDescription>Danh sách CV đã gắn với chiến dịch này.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div
                  className="inline-flex w-full max-w-md rounded-lg border bg-muted/40 p-1"
                  role="tablist"
                  aria-label="Lọc theo kết quả"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "pass"}
                    onClick={() => setActiveTab("pass")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-2 text-center text-xs font-medium transition sm:text-sm",
                      activeTab === "pass"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Đạt ({detail.totalPass})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "reject"}
                    onClick={() => setActiveTab("reject")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-2 text-center text-xs font-medium transition sm:text-sm",
                      activeTab === "reject"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Loại ({detail.totalReject})
                  </button>
                </div>

                {currentCandidates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center">
                    <FileText className="size-10 text-muted-foreground/35" />
                    <p className="text-sm text-muted-foreground">Chưa có ứng viên trong mục này.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Ứng viên</th>
                          <th className="hidden px-4 py-3 font-medium sm:table-cell">Email</th>
                          <th className="px-4 py-3 font-medium">Điểm</th>
                          <th className="px-4 py-3 font-medium text-right">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {currentCandidates.map((candidate) => (
                          <tr key={candidate._id || `${candidate.email}-${candidate.name}`} className="bg-card">
                            <td className="px-4 py-3">
                              <p className="font-medium">{candidate.name?.trim() || "Chưa rõ tên"}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:hidden">
                                {candidate.email || "—"}
                              </p>
                            </td>
                            <td className="hidden max-w-[220px] truncate px-4 py-3 text-muted-foreground sm:table-cell">
                              {candidate.email || "—"}
                            </td>
                            <td className="px-4 py-3 tabular-nums font-medium">{candidate.score}/100</td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant={candidate.decision === "pass" ? "success" : "destructive"}>
                                {candidate.decision === "pass" ? "Đạt" : "Loại"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-4">
            <Card>
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <BriefcaseBusiness className="size-4 shrink-0" />
                  Tự động hóa
                </CardTitle>
                <CardDescription className="flex items-start gap-2 text-xs">
                  <SlidersHorizontal className="mt-0.5 size-3.5 shrink-0" />
                  Bật/tắt từng tùy chọn; thay đổi được lưu ngay.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <ul className="space-y-3">
                  {automationItems.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-start justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 px-4 py-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium leading-snug">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={(checked) => void updateAutomation(item.key, checked)}
                        className="shrink-0"
                        aria-label={item.title}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
