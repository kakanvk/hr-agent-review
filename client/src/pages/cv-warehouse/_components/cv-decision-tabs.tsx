import { cn } from "@/lib/utils"

export type CvDecisionFilter = "all" | "pass" | "reject"

const TABS: { id: CvDecisionFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "pass", label: "Đạt" },
  { id: "reject", label: "Không đạt" },
]

type CvDecisionTabsProps = {
  value: CvDecisionFilter
  onChange: (value: CvDecisionFilter) => void
  countAll: number
  countPass: number
  countReject: number
}

export function CvDecisionTabs({
  value,
  onChange,
  countAll,
  countPass,
  countReject,
}: CvDecisionTabsProps) {
  const countFor = (id: CvDecisionFilter) =>
    id === "all" ? countAll : id === "pass" ? countPass : countReject

  return (
    <div
      role="tablist"
      aria-label="Phân loại CV theo kết quả"
      className="flex min-w-0 flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1"
    >
      {TABS.map((tab) => {
        const selected = value === tab.id
        const n = countFor(tab.id)
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`cv-tab-${tab.id}`}
            className={cn(
              "inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "tabular-nums",
                selected ? "text-muted-foreground" : "text-muted-foreground/80",
              )}
            >
              ({n})
            </span>
          </button>
        )
      })}
    </div>
  )
}
