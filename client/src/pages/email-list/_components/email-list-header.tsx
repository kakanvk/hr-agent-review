import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, ScanEye, X } from "lucide-react"
import { DatePicker } from "./date-picker"
import { format, parse } from "date-fns"

type EmailListHeaderProps = {
  page: number
  pageSize: number
  resultSizeEstimate: number
  isLoading: boolean
  canGoPrev: boolean
  canGoNext: boolean
  onPrevPage: () => void
  onNextPage: () => void
  selectedCount?: number
  totalCount?: number
  showCheckboxes?: boolean
  onToggleCheckboxes?: () => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  onAnalyzeSelected?: () => void
  isAnalyzing?: boolean
  fromDate?: string
  toDate?: string
  onFromDateChange?: (date: Date | undefined) => void
  onToDateChange?: (date: Date | undefined) => void
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
  selectedCount = 0,
  totalCount = 0,
  showCheckboxes = false,
  onToggleCheckboxes,
  onSelectAll,
  onDeselectAll,
  onAnalyzeSelected,
  isAnalyzing = false,
  fromDate = "",
  toDate = "",
  onFromDateChange,
  onToDateChange,
}: EmailListHeaderProps) {
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount

  const fromDateObj = fromDate ? parse(fromDate, "yyyy-MM-dd", new Date()) : undefined
  const toDateObj = toDate ? parse(toDate, "yyyy-MM-dd", new Date()) : undefined

  const handleClearFromDate = () => {
    onFromDateChange?.(undefined)
  }

  const handleClearToDate = () => {
    onToDateChange?.(undefined)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Lọc ngày:</span>
        <div className="flex items-center gap-1">
          <DatePicker
            value={fromDateObj}
            onChange={onFromDateChange}
            placeholder="Từ ngày"
          />
          {fromDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFromDate}
              className="h-10 w-10 p-0"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <span className="text-sm text-muted-foreground">đến</span>
        <div className="flex items-center gap-1">
          <DatePicker
            value={toDateObj}
            onChange={onToDateChange}
            placeholder="Đến ngày"
          />
          {toDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearToDate}
              className="h-10 w-10 p-0"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <>
              {showCheckboxes ? (
                <>
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectAll?.()
                      } else {
                        onDeselectAll?.()
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedCount > 0 ? `${selectedCount}/${totalCount}` : `${totalCount}`}
                  </span>
                  {selectedCount > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDeselectAll}
                      >
                        Bỏ chọn
                      </Button>
                      <Button
                        size="sm"
                        onClick={onAnalyzeSelected}
                        disabled={isAnalyzing}
                      >
                        <ScanEye className="size-3.5" />
                        {isAnalyzing ? "Đang phân tích..." : "Phân tích"}
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleCheckboxes}
                >
                  Chọn nhiều
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onPrevPage} disabled={!canGoPrev || isLoading}>
            <ChevronLeft className="size-4" />Trang trước
          </Button>
          <Button onClick={onNextPage} disabled={!canGoNext || isLoading}>
            Trang sau<ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
