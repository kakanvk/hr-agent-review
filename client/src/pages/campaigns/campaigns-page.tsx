import { useEffect, useState } from "react"
import { CalendarDays, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { API_BASE_URL, AUTH_KEY } from "@/constants/auth"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DatePicker } from "@/components/date-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

type CampaignItem = {
  id: string
  name: string
  description: string
  startDate: string | null
  endDate: string | null
  isEnabled: boolean
  autoRejectEnabled: boolean
  autoPassEnabled: boolean
  totalApply: number
  totalPass: number
  totalReject: number
}

const formatDate = (value: string | null) => {
  if (!value) {
    return "Chưa đặt"
  }

  return new Date(value).toLocaleDateString("vi-VN")
}

export function CampaignsPage() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null)
  const [deletingCampaignId, setDeletingCampaignId] = useState("")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const getTokenOrThrow = () => {
    const token = localStorage.getItem(AUTH_KEY)
    if (!token) {
      throw new Error("Thiếu token đăng nhập. Vui lòng đăng nhập lại.")
    }
    return token
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setStartDate(undefined)
    setEndDate(undefined)
  }

  const fillForm = (campaign: CampaignItem) => {
    setName(campaign.name)
    setDescription(campaign.description || "")
    setStartDate(campaign.startDate ? new Date(campaign.startDate) : undefined)
    setEndDate(campaign.endDate ? new Date(campaign.endDate) : undefined)
  }

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      setError("")
      const token = getTokenOrThrow()
      const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || "Không thể tải danh sách chiến dịch")
      }

      setCampaigns(payload.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách chiến dịch")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const saveCampaign = async () => {
    if (!name.trim()) {
      toast.error("Tên chiến dịch là bắt buộc")
      return
    }

    try {
      setIsSubmitting(true)
      const token = getTokenOrThrow()
      const isEditMode = Boolean(editingCampaign)
      const url = isEditMode
        ? `${API_BASE_URL}/api/campaigns/${editingCampaign?.id}`
        : `${API_BASE_URL}/api/campaigns`
      const method = isEditMode ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.message || "Không thể lưu chiến dịch")
      }

      toast.success(isEditMode ? "Đã cập nhật chiến dịch" : "Đã tạo chiến dịch")
      setIsCreateOpen(false)
      setEditingCampaign(null)
      resetForm()
      await fetchCampaigns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu chiến dịch")
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeCampaign = async (campaignId: string) => {
    try {
      setIsSubmitting(true)
      const token = getTokenOrThrow()
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.message || "Không thể xóa chiến dịch")
      }

      toast.success("Đã xóa chiến dịch")
      setDeletingCampaignId("")
      await fetchCampaigns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa chiến dịch")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Danh sách chiến dịch</h2>
          <p className="text-sm text-muted-foreground">Tạo và quản lý các chiến dịch nhận CV riêng biệt</p>
        </div>
        <Button
          onClick={() => {
            setEditingCampaign(null)
            resetForm()
            setIsCreateOpen(true)
          }}
        >
          <Plus className="size-4" />
          Tạo chiến dịch
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`campaign-skeleton-${index}`} className="space-y-2 rounded-xl border p-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center">
          <CalendarDays className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Chưa có chiến dịch nào. Hãy tạo chiến dịch đầu tiên.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="transition hover:border-primary/40 hover:bg-muted/20"
            >
              <CardContent className="p-4 py-0">
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <p className="text-lg font-semibold">{campaign.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{campaign.description || "Không có mô tả"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant={campaign.isEnabled ? "success" : "secondary"}>
                      {campaign.isEnabled ? "Đang bật" : "Đang tắt"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCampaign(campaign)
                        fillForm(campaign)
                        setIsCreateOpen(true)
                      }}
                    >
                      Sửa
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingCampaignId(campaign.id)}>
                      Xóa
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div className="rounded-md border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">CV apply: </span>
                    <span className="font-semibold">{campaign.totalApply}</span>
                  </div>
                  <div className="rounded-md border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Pass: </span>
                    <span className="font-semibold">{campaign.totalPass}</span>
                  </div>
                  <div className="rounded-md border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Trượt: </span>
                    <span className="font-semibold">{campaign.totalReject}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) {
            setEditingCampaign(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Cập nhật chiến dịch" : "Tạo chiến dịch mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên chiến dịch" />
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Mô tả chiến dịch"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ngày bắt đầu</p>
                <DatePicker value={startDate} onChange={setStartDate} placeholder="Chọn ngày bắt đầu" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ngày kết thúc</p>
                <DatePicker value={endDate} onChange={setEndDate} placeholder="Chọn ngày kết thúc" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveCampaign} disabled={isSubmitting}>
              {editingCampaign ? "Lưu thay đổi" : "Tạo chiến dịch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingCampaignId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCampaignId("")
          }
        }}
        title="Xác nhận xóa chiến dịch"
        description="Thao tác này sẽ xóa cả danh sách CV đã gắn với chiến dịch. Bạn có chắc chắn?"
        confirmLabel="Xóa chiến dịch"
        isPending={isSubmitting}
        onConfirm={() => {
          if (!deletingCampaignId) {
            return
          }
          void removeCampaign(deletingCampaignId)
        }}
      />
    </div>
  )
}
