import { useEffect, useMemo, useState, type MouseEvent } from "react"
import { FileText, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { API_BASE_URL, AUTH_KEY } from "@/constants/auth"
import { cn } from "@/lib/utils"

import { CvDecisionTabs, type CvDecisionFilter } from "./_components/cv-decision-tabs"
import { CvDetailDialog } from "./_components/cv-detail-dialog"
import { CvListThumbnail } from "./_components/cv-list-thumbnail"
import { mapCandidate } from "./map-candidate"
import type { CandidateItem } from "./types"

export function CvWarehousePage() {
  const [search, setSearch] = useState("")
  const [selectedCv, setSelectedCv] = useState<CandidateItem | null>(null)
  const [isCvDialogOpen, setIsCvDialogOpen] = useState(false)
  const [cvList, setCvList] = useState<CandidateItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [candidateToDelete, setCandidateToDelete] = useState<CandidateItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState("")
  const [decisionTab, setDecisionTab] = useState<CvDecisionFilter>("all")

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setIsLoading(true)
        setError("")
        const token = localStorage.getItem(AUTH_KEY)
        if (!token) {
          throw new Error("Thiếu token đăng nhập. Vui lòng đăng nhập lại.")
        }

        const response = await fetch(`${API_BASE_URL}/api/candidates`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.message || "Không thể tải kho CV")
        }

        const data = Array.isArray(payload.data) ? payload.data : []
        setCvList(data.map((row: Record<string, unknown>) => mapCandidate(row)))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải kho CV"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCandidates()
  }, [])

  const passCount = useMemo(
    () => cvList.filter((item) => item.decision === "pass").length,
    [cvList],
  )
  const rejectCount = useMemo(
    () => cvList.filter((item) => item.decision === "reject").length,
    [cvList],
  )

  const filteredCvList = useMemo(() => {
    return cvList
      .filter((item) => {
        if (decisionTab === "pass") {
          return item.decision === "pass"
        }
        if (decisionTab === "reject") {
          return item.decision === "reject"
        }
        return true
      })
      .filter((item) => {
        const keyword = search.trim().toLowerCase()
        if (!keyword) {
          return true
        }

        return (
          item.candidateName.toLowerCase().includes(keyword) ||
          item.email.toLowerCase().includes(keyword) ||
          item.skills.some((skill) => skill.toLowerCase().includes(keyword))
        )
      })
  }, [cvList, decisionTab, search])

  const openCvDetail = (cvItem: CandidateItem) => {
    setSelectedCv(cvItem)
    setIsCvDialogOpen(true)
  }

  const openDeleteConfirm = (event: MouseEvent<HTMLButtonElement>, cvItem: CandidateItem) => {
    event.stopPropagation()
    setCandidateToDelete(cvItem)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteCandidate = async () => {
    if (!candidateToDelete) {
      return
    }

    try {
      setDeletingId(candidateToDelete.id)
      const token = localStorage.getItem(AUTH_KEY)
      if (!token) {
        throw new Error("Thiếu token đăng nhập.")
      }

      const response = await fetch(`${API_BASE_URL}/api/candidates/${candidateToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.message || "Không thể xóa CV")
      }

      setCvList((prev) => prev.filter((item) => item.id !== candidateToDelete.id))
      if (selectedCv?.id === candidateToDelete.id) {
        setIsCvDialogOpen(false)
        setSelectedCv(null)
      }
      toast.success("Đã xóa CV khỏi kho.")
      setIsDeleteDialogOpen(false)
      setCandidateToDelete(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xóa CV"
      toast.error(message)
    } finally {
      setDeletingId("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <CvDecisionTabs
          value={decisionTab}
          onChange={setDecisionTab}
          countAll={cvList.length}
          countPass={passCount}
          countReject={rejectCount}
        />
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-2 left-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên, email, kỹ năng..."
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Đang tải kho CV...</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : filteredCvList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/15 py-14 text-center">
          <FileText className="size-10 shrink-0 text-muted-foreground/35" aria-hidden />
          <p className="max-w-md px-2 text-sm text-muted-foreground">
            {cvList.length === 0
              ? "Chưa có ứng viên nào trong kho. Hãy phân tích CV từ email hoặc nguồn khác để hiển thị tại đây."
              : search.trim() !== ""
                ? "Không có CV phù hợp với từ khóa tìm kiếm hoặc tab đã chọn. Thử đổi từ khóa hoặc chọn tab khác."
                : "Không có CV nào trong nhóm này. Chọn tab khác hoặc xem Tất cả."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredCvList.map((cvItem) => (
            <Card
              key={cvItem.id}
              className="group relative cursor-pointer gap-0 overflow-hidden p-0 transition hover:ring-2 hover:ring-primary/30"
              onClick={() => openCvDetail(cvItem)}
            >
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                className="absolute top-2 right-2 z-10 size-7 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                title="Xóa CV"
                disabled={deletingId === cvItem.id}
                onClick={(event) => openDeleteConfirm(event, cvItem)}
              >
                <Trash2 className="size-3.5" />
              </Button>
              <div className="relative">
                <CvListThumbnail item={cvItem} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-2.5 pt-10 pb-2.5">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 border-0 text-[0.65rem] font-semibold shadow-md",
                        cvItem.decision === "pass"
                          ? "bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
                          : "bg-rose-600 text-white dark:bg-rose-600 dark:text-white",
                      )}
                    >
                      {cvItem.decision === "pass" ? "Đạt" : "Loại"}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="shrink-0 border-0 bg-amber-400 text-[0.65rem] font-bold text-amber-950 tabular-nums shadow-md dark:bg-amber-400 dark:text-amber-950"
                    >
                      {cvItem.score}/100
                    </Badge>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-2.5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight">{cvItem.candidateName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {cvItem.email || "Không có email"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cvItem.skills.length > 0 ? (
                    <>
                      {cvItem.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="max-w-[140px] truncate text-[0.65rem]">
                          {skill}
                        </Badge>
                      ))}
                      {cvItem.skills.length > 3 ? (
                        <Badge variant="outline" className="text-[0.65rem]">
                          +{cvItem.skills.length - 3}
                        </Badge>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) {
            setCandidateToDelete(null)
          }
        }}
        title="Xóa CV?"
        description={
          candidateToDelete
            ? `Xóa CV của “${candidateToDelete.candidateName}” khỏi kho? Thao tác này không thể hoàn tác.`
            : ""
        }
        confirmLabel="Xóa CV"
        confirmPendingLabel="Đang xóa..."
        cancelLabel="Hủy"
        confirmVariant="destructive"
        isPending={Boolean(deletingId)}
        onConfirm={() => void handleDeleteCandidate()}
      />

      <CvDetailDialog
        open={isCvDialogOpen}
        onOpenChange={setIsCvDialogOpen}
        candidate={selectedCv}
      />
    </div>
  )
}
