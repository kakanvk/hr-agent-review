import { useEffect, useState } from "react"

import { API_BASE_URL, AUTH_KEY } from "@/constants/auth"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import type { Criterion } from "@/types/app"
import { SettingsCriteriaSkeleton } from "@/pages/settings/_components/settings-criteria-skeleton"
import { SettingsCriterionDialog } from "@/pages/settings/_components/settings-criterion-dialog"
import { SettingsCriterionItem } from "@/pages/settings/_components/settings-criterion-item"
import { SettingsEmptyState } from "@/pages/settings/_components/settings-empty-state"
import { Plus } from "lucide-react"
import { toast } from "sonner"

type SettingsPayload = {
  id: string
  criteria: Criterion[]
}

export function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddCriterionOpen, setIsAddCriterionOpen] = useState(false)
  const [isEditCriterionOpen, setIsEditCriterionOpen] = useState(false)
  const [newCriterionTitle, setNewCriterionTitle] = useState("")
  const [newCriterionDescription, setNewCriterionDescription] = useState("")
  const [editingCriterionId, setEditingCriterionId] = useState("")
  const [editCriterionTitle, setEditCriterionTitle] = useState("")
  const [editCriterionDescription, setEditCriterionDescription] = useState("")
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [deletingCriterionId, setDeletingCriterionId] = useState("")

  const applySettingsPayload = (payload: unknown) => {
    const settings = payload as { data?: SettingsPayload }
    setCriteria(settings.data?.criteria || [])
  }

  const fetchSettings = async () => {
    const token = localStorage.getItem(AUTH_KEY)
    if (!token) {
      setError("Thiếu token đăng nhập. Vui lòng đăng nhập lại.")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError("")
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || "Không thể tải cài đặt")
      }

      applySettingsPayload(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải cài đặt")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const callSettingsApi = async (
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: Record<string, unknown>,
  ) => {
    const token = localStorage.getItem(AUTH_KEY)
    if (!token) {
      throw new Error("Thiếu token đăng nhập. Vui lòng đăng nhập lại.")
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.message || "Không thể cập nhật cài đặt")
    }

    applySettingsPayload(payload)
  }

  const addCriterion = async () => {
    if (!newCriterionTitle.trim() || !newCriterionDescription.trim()) {
      return
    }

    try {
      setIsSubmitting(true)
      setError("")
      await callSettingsApi(`${API_BASE_URL}/api/settings/criteria`, "POST", {
        title: newCriterionTitle.trim(),
        description: newCriterionDescription.trim(),
        enabled: true,
      })
      setNewCriterionTitle("")
      setNewCriterionDescription("")
      setIsAddCriterionOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm chỉ tiêu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCriterion = async (criterionId: string, enabled: boolean) => {
    try {
      setError("")
      await callSettingsApi(`${API_BASE_URL}/api/settings/criteria/${criterionId}`, "PATCH", {
        enabled,
      })
      toast.success(enabled ? "Đã bật chỉ tiêu thành công" : "Đã tắt chỉ tiêu thành công")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật chỉ tiêu"
      setError(message)
      toast.error(message)
    }
  }

  const openEditDialog = (criterion: Criterion) => {
    setEditingCriterionId(criterion.id)
    setEditCriterionTitle(criterion.title)
    setEditCriterionDescription(criterion.description)
    setIsEditCriterionOpen(true)
  }

  const updateCriterion = async () => {
    if (!editingCriterionId || !editCriterionTitle.trim() || !editCriterionDescription.trim()) {
      return
    }

    try {
      setIsSubmitting(true)
      setError("")
      await callSettingsApi(`${API_BASE_URL}/api/settings/criteria/${editingCriterionId}`, "PATCH", {
        title: editCriterionTitle.trim(),
        description: editCriterionDescription.trim(),
      })
      setIsEditCriterionOpen(false)
      toast.success("Đã cập nhật chỉ tiêu thành công")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật chỉ tiêu"
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeCriterion = async (criterionId: string) => {
    try {
      setIsSubmitting(true)
      setError("")
      await callSettingsApi(`${API_BASE_URL}/api/settings/criteria/${criterionId}`, "DELETE")
      toast.success("Đã xóa chỉ tiêu thành công")
      setDeletingCriterionId("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xóa chỉ tiêu"
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Danh sách chỉ tiêu đánh giá</h2>
          <p className="text-sm text-muted-foreground">Bật/tắt, chỉnh sửa hoặc thêm chỉ tiêu mới</p>
        </div>
        <Button onClick={() => setIsAddCriterionOpen(true)} size='lg'>
          <Plus className="size-4" />
          Thêm chỉ tiêu
        </Button>
      </div>

      <div className="space-y-3">

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {isLoading ? (
          <SettingsCriteriaSkeleton />
        ) : criteria.length === 0 ? (
          <SettingsEmptyState />
        ) : (
          criteria.map((criterion) => (
            <SettingsCriterionItem
              key={criterion.id}
              criterion={criterion}
              onEdit={openEditDialog}
              onDelete={setDeletingCriterionId}
              onToggle={toggleCriterion}
            />
          ))
        )}
      </div>

      <SettingsCriterionDialog
        open={isAddCriterionOpen}
        onOpenChange={setIsAddCriterionOpen}
        title="Thêm chỉ tiêu mới"
        description="Mô tả ngắn gọn điều kiện để hệ thống đánh giá CV"
        submitLabel="Lưu chỉ tiêu"
        criterionTitle={newCriterionTitle}
        criterionDescription={newCriterionDescription}
        isSubmitting={isSubmitting}
        onTitleChange={setNewCriterionTitle}
        onDescriptionChange={setNewCriterionDescription}
        onSubmit={addCriterion}
      />

      <SettingsCriterionDialog
        open={isEditCriterionOpen}
        onOpenChange={setIsEditCriterionOpen}
        title="Chỉnh sửa chỉ tiêu"
        description="Cập nhật tiêu đề và mô tả của chỉ tiêu này"
        submitLabel="Lưu thay đổi"
        criterionTitle={editCriterionTitle}
        criterionDescription={editCriterionDescription}
        isSubmitting={isSubmitting}
        onTitleChange={setEditCriterionTitle}
        onDescriptionChange={setEditCriterionDescription}
        onSubmit={updateCriterion}
      />

      <ConfirmDialog
        open={Boolean(deletingCriterionId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCriterionId("")
          }
        }}
        title="Xác nhận xóa chỉ tiêu"
        description="Thao tác này không thể hoàn tác. Bạn có chắc chắn muốn xóa chỉ tiêu này?"
        confirmLabel="Xóa chỉ tiêu"
        isPending={isSubmitting}
        onConfirm={() => {
          if (!deletingCriterionId) {
            return
          }
          void removeCriterion(deletingCriterionId)
        }}
      />
    </div>
  )
}
