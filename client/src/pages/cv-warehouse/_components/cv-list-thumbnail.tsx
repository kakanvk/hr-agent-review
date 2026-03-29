import { FileText } from "lucide-react"

import { API_BASE_URL } from "@/constants/auth"

import type { CandidateItem } from "../types"

export function CvListThumbnail({ item }: { item: CandidateItem }) {
  const fileUrl = item.sourceFileUrl ? `${API_BASE_URL}${item.sourceFileUrl}` : ""
  const isImage = Boolean(fileUrl && item.sourceFileMimeType.startsWith("image/"))
  const isPdf = Boolean(fileUrl && item.sourceFileMimeType.includes("pdf"))

  if (isImage) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={fileUrl}
          alt={item.sourceAttachmentName || "CV"}
          className="h-full w-full object-cover object-top"
          loading="lazy"
        />
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/50 px-4">
        <FileText className="size-12 text-muted-foreground/80" />
        <span className="text-xs font-medium text-muted-foreground">Tài liệu PDF</span>
        <span className="line-clamp-1 max-w-full text-center text-[0.65rem] text-muted-foreground/80">
          {item.sourceAttachmentName || "CV.pdf"}
        </span>
      </div>
    )
  }

  if (fileUrl) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted/40 px-3">
        <FileText className="size-10 text-muted-foreground" />
        <span className="line-clamp-2 text-center text-[0.65rem] text-muted-foreground">
          {item.sourceAttachmentName || "File đính kèm"}
        </span>
      </div>
    )
  }

  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 border-b bg-muted/20 px-3">
      <FileText className="size-8 text-muted-foreground/60" />
      <span className="text-center text-[0.65rem] text-muted-foreground">Chưa có file xem trước</span>
    </div>
  )
}
