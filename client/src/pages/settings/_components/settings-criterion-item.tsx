import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { Criterion } from "@/types/app"

type SettingsCriterionItemProps = {
  criterion: Criterion
  onEdit: (criterion: Criterion) => void
  onDelete: (criterionId: string) => void
  onToggle: (criterionId: string, enabled: boolean) => void
}

export function SettingsCriterionItem({
  criterion,
  onEdit,
  onDelete,
  onToggle,
}: SettingsCriterionItemProps) {
  const handleToggle = () => {
    onToggle(criterion.id, !criterion.enabled)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          handleToggle()
        }
      }}
      className="cursor-pointer group rounded-md border p-3 transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">{criterion.title}</p>
          <p className="text-xs text-muted-foreground">{criterion.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                onEdit(criterion)
              }}
            >
              <Pencil className="mr-1 size-3.5" />
              Sửa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                onDelete(criterion.id)
              }}
            >
              <Trash2 className="mr-1 size-3.5" />
              Xóa
            </Button>
          </div>
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Switch
              checked={criterion.enabled}
              onCheckedChange={(checked) => onToggle(criterion.id, checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
