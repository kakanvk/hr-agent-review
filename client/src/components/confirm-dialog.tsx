import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  /** Khi `isPending`, hiển thị trên nút xác nhận (ví dụ: "Đang xóa...") */
  confirmPendingLabel?: string
  cancelLabel?: string
  isPending?: boolean
  /** Nút xác nhận: `destructive` cho xóa / hành động nguy hiểm */
  confirmVariant?: "default" | "destructive"
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  confirmPendingLabel,
  cancelLabel = "Hủy",
  isPending = false,
  confirmVariant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const confirmText =
    isPending && confirmPendingLabel ? confirmPendingLabel : confirmLabel

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isPending}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
