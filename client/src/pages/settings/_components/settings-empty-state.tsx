import { SlidersHorizontal } from "lucide-react"

export function SettingsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center">
      <SlidersHorizontal className="size-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">Chưa có chỉ tiêu nào. Hãy thêm chỉ tiêu đầu tiên.</p>
    </div>
  )
}
