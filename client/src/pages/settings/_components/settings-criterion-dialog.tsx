import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type SettingsCriterionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  criterionTitle: string
  criterionDescription: string
  isSubmitting: boolean
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: () => void
}

export function SettingsCriterionDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  criterionTitle,
  criterionDescription,
  isSubmitting,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
}: SettingsCriterionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={criterionTitle}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Tên chỉ tiêu"
          />
          <Textarea
            value={criterionDescription}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Mô tả chỉ tiêu"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
