import { useEffect, useState } from "react"
import { Inbox } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { API_BASE_URL, AUTH_KEY } from "@/constants/auth"
import { EmailListHeader } from "@/pages/email-list/_components/email-list-header"
import { EmailListItems, type EmailItem } from "@/pages/email-list/_components/email-list-items"
import { EmailListSkeleton } from "@/pages/email-list/_components/email-list-skeleton"
import { AnalysisResultsDialog, type AnalysisResult } from "@/pages/email-list/_components/analysis-results-dialog"
import { CvDetailDialog } from "@/pages/cv-warehouse/_components/cv-detail-dialog"
import type { CandidateItem } from "@/pages/cv-warehouse/types"

type EmailListPayload = {
  items: EmailItem[]
  nextPageToken: string
  pageSize: number
  resultSizeEstimate: number
}

type AnalyzeCandidateResponse = {
  _id?: string
  name?: string
  score?: number
  decision?: "pass" | "reject"
  reason?: string
  email?: string
  skills?: string[]
  strengths?: string[]
  weaknesses?: string[]
  summary?: string
  raw_cv_text?: string
  source_file_url?: string
  source_file_mime_type?: string
  source_attachment_name?: string
}

export function EmailListPage() {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCheckboxes, setShowCheckboxes] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzingBatch, setIsAnalyzingBatch] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [nextPageToken, setNextPageToken] = useState("")
  const [pageTokens, setPageTokens] = useState<string[]>([""])
  const [resultSizeEstimate, setResultSizeEstimate] = useState(0)
  const [analyzingId, setAnalyzingId] = useState("")
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [analysisCache, setAnalysisCache] = useState<Map<string, AnalyzeCandidateResponse>>(new Map())
  const [showCvDetailDialog, setShowCvDetailDialog] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null)

  const PAGE_SIZE = 10

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setIsLoading(true)
        setError("")

        const token = localStorage.getItem(AUTH_KEY)
        if (!token) {
          setError("Thiếu token đăng nhập. Vui lòng đăng nhập lại.")
          return
        }

        const currentToken = pageTokens[page - 1] || ""
        const query = new URLSearchParams({
          pageSize: String(PAGE_SIZE),
        })

        if (currentToken) {
          query.set("pageToken", currentToken)
        }

        if (fromDate) {
          query.set("fromDate", fromDate)
        }

        if (toDate) {
          query.set("toDate", toDate)
        }

        // Fetch emails
        const response = await fetch(`${API_BASE_URL}/api/gmail/messages?${query.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || "Không thể tải danh sách email")
        }

        const data = (payload.data || {}) as EmailListPayload
        let emailsWithAnalysis = data.items || []

        // Fetch candidates để check email nào đã phân tích
        try {
          const candidatesResponse = await fetch(`${API_BASE_URL}/api/candidates`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (candidatesResponse.ok) {
            const candidatesPayload = await candidatesResponse.json()
            const candidates = (candidatesPayload.data || []) as Array<{ _id: string; source_message_id?: string }>

            // Map source_message_id to candidateId
            const messageIdToCandidateId = new Map(
              candidates.map((c) => [c.source_message_id, c._id])
            )

            // Update emails with analyzedCandidateId
            emailsWithAnalysis = emailsWithAnalysis.map((email) => ({
              ...email,
              analyzedCandidateId: messageIdToCandidateId.get(email.id),
            }))
          }
        } catch {
          // Nếu lấy candidates fail thì bỏ qua
        }

        setEmails(emailsWithAnalysis)
        setNextPageToken(data.nextPageToken || "")
        setResultSizeEstimate(data.resultSizeEstimate || 0)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải danh sách email"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmails()
  }, [page, pageTokens, fromDate, toDate])

  const handleNextPage = () => {
    if (!nextPageToken) {
      return
    }

    const nextPage = page + 1
    setPageTokens((prev) => {
      const cloned = [...prev]
      cloned[nextPage - 1] = nextPageToken
      return cloned
    })
    setPage(nextPage)
    setSelectedIds(new Set())
    setShowCheckboxes(false)
  }

  const handlePrevPage = () => {
    if (page <= 1) {
      return
    }
    setPage((prev) => prev - 1)
    setSelectedIds(new Set())
    setShowCheckboxes(false)
  }

  const handleFromDateChange = (date: Date | undefined) => {
    if (!date) {
      setFromDate("")
      return
    }
    // Format to yyyy-MM-dd for API
    const formatted = format(date, "yyyy-MM-dd")
    setFromDate(formatted)
    setPage(1)
    setPageTokens([""])
  }

  const handleToDateChange = (date: Date | undefined) => {
    if (!date) {
      setToDate("")
      return
    }
    // Format to yyyy-MM-dd for API
    const formatted = format(date, "yyyy-MM-dd")
    setToDate(formatted)
    setPage(1)
    setPageTokens([""])
  }

  const handleToggleCheckboxes = () => {
    setShowCheckboxes(!showCheckboxes)
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(emails.map((e) => e.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
    setShowCheckboxes(false)
  }

  const handleAnalyzeEmail = async (email: EmailItem) => {
    try {
      setAnalyzingId(email.id)

      // Check cache trước
      if (analysisCache.has(email.id)) {
        const cachedData = analysisCache.get(email.id)!
        const name = cachedData.name?.trim() || "Ứng viên"
        const score = typeof cachedData.score === "number" ? cachedData.score : 0
        const decisionLabel = cachedData.decision === "pass" ? "Đạt" : "Loại"
        const reason = cachedData.reason?.trim() || "Không có ghi chú"
        toast.success(`${name}: ${score}/100 - ${decisionLabel}. ${reason}`)

        // Mark email as analyzed
        setEmails((prev) =>
          prev.map((e) =>
            e.id === email.id ? { ...e, analyzedCandidateId: cachedData._id } : e
          )
        )
        setAnalyzingId("")
        return
      }

      const token = localStorage.getItem(AUTH_KEY)
      if (!token) {
        throw new Error("Thiếu token đăng nhập. Vui lòng đăng nhập lại.")
      }

      const response = await fetch(`${API_BASE_URL}/api/candidates/analyze-from-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId: email.id }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || "Không thể phân tích email")
      }

      const data = (payload?.data || {}) as AnalyzeCandidateResponse
      // Cache result
      setAnalysisCache((prev) => new Map(prev).set(email.id, data))

      // Mark email as analyzed
      setEmails((prev) =>
        prev.map((e) =>
          e.id === email.id ? { ...e, analyzedCandidateId: data._id } : e
        )
      )

      const name = data.name?.trim() || "Ứng viên"
      const score = typeof data.score === "number" ? data.score : 0
      const decisionLabel = data.decision === "pass" ? "Đạt" : "Loại"
      const reason = data.reason?.trim() || "Không có ghi chú"
      toast.success(`${name}: ${score}/100 - ${decisionLabel}. ${reason}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể phân tích email"
      toast.error(message)
    } finally {
      setAnalyzingId("")
    }
  }

  const handleAnalyzeSelected = async () => {
    if (selectedIds.size === 0) return

    try {
      setIsAnalyzingBatch(true)
      const token = localStorage.getItem(AUTH_KEY)
      if (!token) {
        throw new Error("Thiếu token đăng nhập. Vui lòng đăng nhập lại.")
      }

      const results: AnalysisResult[] = []
      const selectedEmails = emails.filter((e) => selectedIds.has(e.id))
      const newCache = new Map(analysisCache)

      for (const email of selectedEmails) {
        try {
          let candidate: AnalyzeCandidateResponse

          // Check cache trước
          if (analysisCache.has(email.id)) {
            candidate = analysisCache.get(email.id)!
          } else {
            // Gọi API nếu chưa có cache
            const response = await fetch(`${API_BASE_URL}/api/candidates/analyze-from-email`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ messageId: email.id }),
            })
            const payload = await response.json()

            if (!response.ok) {
              continue
            }

            candidate = (payload?.data || {}) as AnalyzeCandidateResponse
            newCache.set(email.id, candidate)
          }

          // Gọi API chi tiết để lấy dữ liệu đầy đủ bao gồm file URL
          if (candidate._id) {
            try {
              const detailResponse = await fetch(`${API_BASE_URL}/api/candidates/${candidate._id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              if (detailResponse.ok) {
                const detailPayload = await detailResponse.json()
                const fullCandidate = (detailPayload?.data || {}) as AnalyzeCandidateResponse
                results.push(fullCandidate)
              } else {
                results.push(candidate)
              }
            } catch (detailError) {
              // Fallback to initial candidate data nếu detail API fails
              results.push(candidate)
            }
          } else {
            results.push(candidate)
          }
        } catch {
          // Continue with next email
        }
      }

      // Update cache
      setAnalysisCache(newCache)

      // Mark analyzed emails
      setEmails((prev) =>
        prev.map((e) => {
          const result = results.find((r) => r._id === e.analyzedCandidateId || newCache.get(e.id)?._id === r._id)
          if (result) {
            return { ...e, analyzedCandidateId: result._id }
          }
          const cachedData = newCache.get(e.id)
          if (cachedData && selectedIds.has(e.id)) {
            return { ...e, analyzedCandidateId: cachedData._id }
          }
          return e
        })
      )

      if (results.length === 0) {
        toast.error("Không thể phân tích bất kỳ email nào")
        return
      }

      setAnalysisResults(results)
      setShowResultsDialog(true)
      setSelectedIds(new Set())
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể phân tích email"
      toast.error(message)
    } finally {
      setIsAnalyzingBatch(false)
    }
  }

  const handleViewAnalyzedEmail = async (email: EmailItem) => {
    try {
      if (!email.analyzedCandidateId) return

      const token = localStorage.getItem(AUTH_KEY)
      if (!token) {
        throw new Error("Thiếu token đăng nhập. Vui lòng đăng nhập lại.")
      }

      const response = await fetch(`${API_BASE_URL}/api/candidates/${email.analyzedCandidateId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Không thể tải thông tin CV")
      }

      const payload = await response.json()
      const data = payload?.data as any

      if (!data) {
        throw new Error("Không tìm thấy CV")
      }

      // Map snake_case from API to camelCase for CandidateItem
      const candidate: CandidateItem = {
        id: data._id || data.id || "",
        candidateName: data.name || "",
        email: data.email || "",
        score: data.score || 0,
        decision: data.decision as "pass" | "reject",
        skills: data.skills || [],
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        summary: data.summary || "",
        rawCvText: data.raw_cv_text || "",
        sourceAttachmentName: data.source_attachment_name || "",
        sourceFileUrl: data.source_file_url || "",
        sourceFileMimeType: data.source_file_mime_type || "",
        createdAt: data.createdAt || new Date().toISOString(),
      }

      setSelectedCandidate(candidate)
      setShowCvDetailDialog(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải CV"
      toast.error(message)
    }
  }

  return (
    <div className="space-y-4">
      <EmailListHeader
        page={page}
        pageSize={PAGE_SIZE}
        resultSizeEstimate={resultSizeEstimate}
        isLoading={isLoading}
        canGoPrev={page > 1}
        canGoNext={Boolean(nextPageToken)}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        selectedCount={selectedIds.size}
        totalCount={emails.length}
        showCheckboxes={showCheckboxes}
        onToggleCheckboxes={handleToggleCheckboxes}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onAnalyzeSelected={handleAnalyzeSelected}
        isAnalyzing={isAnalyzingBatch}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={handleFromDateChange}
        onToDateChange={handleToDateChange}
      />

      {isLoading ? (
        <EmailListSkeleton rows={PAGE_SIZE} />
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/15 py-14 text-center">
          <Inbox className="size-10 shrink-0 text-muted-foreground/35" aria-hidden />
          <p className="max-w-sm px-2 text-sm text-muted-foreground">
            Chưa có email để hiển thị. Nếu hộp thư có thư mới, thử tải lại hoặc chuyển trang.
          </p>
        </div>
      ) : (
        <EmailListItems
          emails={emails}
          analyzingId={analyzingId}
          showCheckboxes={showCheckboxes}
          selectedIds={selectedIds}
          onAnalyzeEmail={handleAnalyzeEmail}
          onSelectionChange={setSelectedIds}
          onViewAnalyzedEmail={handleViewAnalyzedEmail}
        />
      )}

      <AnalysisResultsDialog
        open={showResultsDialog}
        results={analysisResults}
        onOpenChange={setShowResultsDialog}
      />

      <CvDetailDialog
        open={showCvDetailDialog}
        onOpenChange={setShowCvDetailDialog}
        candidate={selectedCandidate}
      />
    </div>
  )
}
