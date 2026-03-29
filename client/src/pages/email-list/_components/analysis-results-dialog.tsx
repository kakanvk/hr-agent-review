import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CvDetailDialog } from "@/pages/cv-warehouse/_components/cv-detail-dialog"
import type { CandidateItem } from "@/pages/cv-warehouse/types"

export type AnalysisResult = {
  _id?: string
  id?: string
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
  rawCvText?: string
  source_file_url?: string
  sourceFileUrl?: string
  source_file_mime_type?: string
  sourceFileMimeType?: string
  source_attachment_name?: string
  sourceAttachmentName?: string
}

type AnalysisResultsDialogProps = {
  open: boolean
  results: AnalysisResult[]
  onOpenChange: (open: boolean) => void
}

function resultsToCandidateItem(result: AnalysisResult): CandidateItem {
  return {
    id: result._id || result.id || "",
    candidateName: result.name || "Ứng viên",
    email: result.email || "",
    score: typeof result.score === "number" ? result.score : 0,
    decision: result.decision as "pass" | "reject",
    skills: result.skills || [],
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    summary: result.summary || "",
    rawCvText: result.raw_cv_text || result.rawCvText || "",
    sourceAttachmentName: result.source_attachment_name || result.sourceAttachmentName || "",
    sourceFileUrl: result.source_file_url || result.sourceFileUrl || "",
    sourceFileMimeType: result.source_file_mime_type || result.sourceFileMimeType || "",
    createdAt: new Date().toISOString(),
  }
}

export function AnalysisResultsDialog({ open, results, onOpenChange }: AnalysisResultsDialogProps) {
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const passCount = results.filter((r) => r.decision === "pass").length
  const rejectCount = results.filter((r) => r.decision === "reject").length
  const avgScore = (results.reduce((sum, r) => sum + (typeof r.score === "number" ? r.score : 0), 0) / results.length).toFixed(1)

  const handleSelect = (result: AnalysisResult) => {
    setSelectedResult(result)
    setShowDetailDialog(true)
  }

  return (
    <>
      <Dialog open={open && !showDetailDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Kết quả phân tích CV</DialogTitle>
            <DialogDescription>
              Đã phân tích {results.length} ứng viên: {passCount} đạt, {rejectCount} loại. Điểm trung bình: {avgScore}/100
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-lg border bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Tổng số</p>
              <p className="text-lg font-semibold">{results.length}</p>
            </div>
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-3 text-center">
              <p className="text-xs text-green-600 dark:text-green-400">Đạt</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">{passCount}</p>
            </div>
            <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-3 text-center">
              <p className="text-xs text-red-600 dark:text-red-400">Loại</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">{rejectCount}</p>
            </div>
          </div>

          <ScrollArea className="h-[calc(80vh-300px)]">
            <div className="space-y-2 pr-4">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(result)}
                  className="w-full rounded-lg border p-3 space-y-2 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{result.name || `Ứng viên ${index + 1}`}</p>
                    <Badge variant={result.decision === "pass" ? "default" : "destructive"}>
                      {result.decision === "pass" ? "Đạt" : "Loại"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Điểm:</span>
                    <span className="font-semibold">{typeof result.score === "number" ? result.score : 0}/100</span>
                  </div>
                  {result.reason && (
                    <p className="text-xs text-muted-foreground italic line-clamp-1">{result.reason}</p>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedResult && (
        <CvDetailDialog
          open={showDetailDialog}
          onOpenChange={(newOpen) => {
            if (!newOpen) {
              setShowDetailDialog(false)
              setSelectedResult(null)
            }
          }}
          candidate={resultsToCandidateItem(selectedResult)}
        />
      )}
    </>
  )
}
