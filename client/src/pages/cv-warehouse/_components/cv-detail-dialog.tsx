import { AlertCircle, CircleCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { API_BASE_URL } from "@/constants/auth"

import type { CandidateItem } from "../types"

type CvDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: CandidateItem | null
}

const previewShell =
  "flex min-h-[180px] w-full items-center justify-center overflow-auto rounded-md"

function CvPreview({ candidate }: { candidate: CandidateItem }) {
  if (!candidate.sourceFileUrl) {
    return (
      <div
        className={`${previewShell} max-h-[min(40vh,400px)] items-start justify-start overflow-y-auto whitespace-pre-wrap p-3 text-left text-xs lg:max-h-full`}
      >
        {candidate.rawCvText || "Không có file CV lưu lại. Chỉ có nội dung text."}
      </div>
    )
  }

  const url = `${API_BASE_URL}${candidate.sourceFileUrl}`

  return (
    <div className={previewShell}>
      {candidate.sourceFileMimeType.startsWith("image/") ? (
        <img
          src={url}
          alt={candidate.sourceAttachmentName || "Ảnh CV"}
          className="max-h-[min(40vh,420px)] w-full object-contain lg:max-h-[min(70dvh,720px)] border"
        />
      ) : candidate.sourceFileMimeType.includes("pdf") ? (
        <iframe
          src={url}
          title={candidate.sourceAttachmentName || "CV dạng PDF"}
          className="h-[min(40vh,420px)] min-h-[200px] w-full rounded-md lg:h-[min(70dvh,720px)]"
        />
      ) : (
        <div className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 p-4 text-center">
          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
            Mở / tải file: {candidate.sourceAttachmentName || "CV"}
          </a>
        </div>
      )}
    </div>
  )
}

export function CvDetailDialog({ open, onOpenChange, candidate }: CvDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="grid max-h-[min(92dvh,calc(100vh-1.5rem))] min-h-0 w-[calc(100vw-1.5rem)] !max-w-5xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:w-full"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b px-5 pb-4 pt-5 pr-12 sm:px-6">
          <DialogTitle className="text-base sm:text-lg">Chi tiết CV và đánh giá</DialogTitle>
        </DialogHeader>

        {candidate ? (
          <div className="flex min-h-0 flex-col overflow-hidden lg:flex-row lg:items-stretch">
            <aside className="flex min-h-0 max-h-[min(38vh,320px)] shrink-0 flex-col border-b bg-muted/15 lg:max-h-none lg:h-full lg:w-[30%] lg:min-w-0 lg:border-b-0 lg:border-r">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
                <CvPreview candidate={candidate} />
              </div>
            </aside>

            <div className="flex min-h-[200px] min-w-0 flex-1 flex-col lg:min-h-0">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-4 sm:px-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <header className="space-y-1">
                      <h3 className="text-base font-semibold leading-snug">{candidate.candidateName}</h3>
                      <p className="break-all text-xs text-muted-foreground">{candidate.email || "Không có email"}</p>
                    </header>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Điểm</span>
                      <Badge variant="outline" className="tabular-nums">
                        {candidate.score}/100
                      </Badge>
                      <span className="text-muted-foreground ml-3">Kết quả</span>
                      <Badge variant={candidate.decision === "pass" ? "success" : "destructive"}>
                        {candidate.decision === "pass" ? "Đạt" : "Loại"}
                      </Badge>
                    </div>
                  </div>

                  <section className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Kỹ năng</h4>
                    {candidate.skills.length === 0 ? (
                      <p className="text-xs text-muted-foreground">—</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="truncate text-[0.65rem]"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </section>

                  {candidate.summary?.trim() ? (
                    <p className="text-pretty rounded-md border bg-muted/30 px-3 py-2 text-xs leading-relaxed">
                      {candidate.summary}
                    </p>
                  ) : null}

                  <section className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Điểm mạnh</h4>
                    {candidate.strengths.length === 0 ? (
                      <p className="text-xs text-muted-foreground">—</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs leading-relaxed">
                        {candidate.strengths.map((text, index) => (
                          <li key={`s-${index}-${text.slice(0, 24)}`} className="flex gap-2">
                            <CircleCheck
                              className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-500"
                              aria-hidden
                            />
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Điểm cần cải thiện</h4>
                    {candidate.weaknesses.length === 0 ? (
                      <p className="text-xs text-muted-foreground">—</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs leading-relaxed">
                        {candidate.weaknesses.map((text, index) => (
                          <li key={`w-${index}-${text.slice(0, 24)}`} className="flex gap-2">
                            <AlertCircle
                              className="mt-0.5 size-4 shrink-0 text-orange-500 dark:text-orange-400"
                              aria-hidden
                            />
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
