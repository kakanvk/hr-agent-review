import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type EmailListHeaderProps = {
  page: number
  pageSize: number
  resultSizeEstimate: number
  isLoading: boolean
  canGoPrev: boolean
  canGoNext: boolean
  onPrevPage: () => void
  onNextPage: () => void
}

export function EmailListHeader({
  page,
  pageSize,
  resultSizeEstimate,
  isLoading,
  canGoPrev,
  canGoNext,
  onPrevPage,
  onNextPage,
}: EmailListHeaderProps) {
  return (
    <div className="flex items-end justify-end gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPrevPage} disabled={!canGoPrev || isLoading}>
          <ChevronLeft className="size-4" />Trang trước
        </Button>
        <Button onClick={onNextPage} disabled={!canGoNext || isLoading}>
          Trang sau<ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
