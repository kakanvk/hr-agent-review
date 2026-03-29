import { useEffect, useState } from "react"
import { Inbox } from "lucide-react"
import { toast } from "sonner"

import { API_BASE_URL, AUTH_KEY } from "@/constants/auth"
import { EmailListHeader } from "@/pages/email-list/_components/email-list-header"
import { EmailListItems, type EmailItem } from "@/pages/email-list/_components/email-list-items"
import { EmailListSkeleton } from "@/pages/email-list/_components/email-list-skeleton"

type EmailListPayload = {
  items: EmailItem[]
  nextPageToken: string
  pageSize: number
  resultSizeEstimate: number
}

type AnalyzeCandidateResponse = {
  name?: string
  score?: number
  decision?: "pass" | "reject"
  reason?: string
}

export function EmailListPage() {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [nextPageToken, setNextPageToken] = useState("")
  const [pageTokens, setPageTokens] = useState<string[]>([""])
  const [resultSizeEstimate, setResultSizeEstimate] = useState(0)
  const [analyzingId, setAnalyzingId] = useState("")

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
        setEmails(data.items || [])
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
  }, [page, pageTokens])

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
  }

  const handlePrevPage = () => {
    if (page <= 1) {
      return
    }
    setPage((prev) => prev - 1)
  }

  const handleAnalyzeEmail = async (email: EmailItem) => {
    try {
      setAnalyzingId(email.id)
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
        <EmailListItems emails={emails} analyzingId={analyzingId} onAnalyzeEmail={handleAnalyzeEmail} />
      )}
    </div>
  )
}
