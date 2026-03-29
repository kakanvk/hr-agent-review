import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

import { API_BASE_URL, AUTH_KEY } from "@/constants/auth"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { mockPipeline } from "@/mocks/automation"
import { toast } from "sonner"

type SettingsData = {
  autoRejectEnabled?: boolean
  autoPassEnabled?: boolean
}

export function AutomationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [autoRejectEnabled, setAutoRejectEnabled] = useState(true)
  const [autoPassEnabled, setAutoPassEnabled] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
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
          throw new Error(payload.message || "Không thể tải cấu hình tự động")
        }

        const settings = (payload.data || {}) as SettingsData
        setAutoRejectEnabled(
          typeof settings.autoRejectEnabled === "boolean"
            ? settings.autoRejectEnabled
            : true,
        )
        setAutoPassEnabled(
          typeof settings.autoPassEnabled === "boolean"
            ? settings.autoPassEnabled
            : false,
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải cấu hình tự động",
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const updateAutomationSettings = async (
    key: "autoRejectEnabled" | "autoPassEnabled",
    value: boolean,
  ) => {
    const token = localStorage.getItem(AUTH_KEY)
    if (!token) {
      const message = "Thiếu token đăng nhập. Vui lòng đăng nhập lại."
      setError(message)
      toast.error(message)
      return
    }

    try {
      setError("")
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: value }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || "Không thể lưu cấu hình")
      }

      toast.success("Đã lưu cấu hình tự động")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể lưu cấu hình"
      setError(message)
      toast.error(message)
      setAutoRejectEnabled((prev) =>
        key === "autoRejectEnabled" ? !value : prev,
      )
      setAutoPassEnabled((prev) =>
        key === "autoPassEnabled" ? !value : prev,
      )
    }
  }

  const handleToggleReject = (checked: boolean) => {
    setAutoRejectEnabled(checked)
    void updateAutomationSettings("autoRejectEnabled", checked)
  }

  const handleTogglePass = (checked: boolean) => {
    setAutoPassEnabled(checked)
    void updateAutomationSettings("autoPassEnabled", checked)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Tự động xử lý kết quả email</CardTitle>
            <CardDescription>
              Hai chế độ hoạt động độc lập: có thể bật/tắt reject hoặc pass tùy theo chính sách tuyển dụng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Tự động từ chối (Auto Reject)</p>
                <p className="text-xs text-muted-foreground">Tự động đánh dấu reject khi không đạt điều kiện.</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <Switch checked={autoRejectEnabled} onCheckedChange={handleToggleReject} />
              )}
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Tự động thông báo pass (Auto Pass)</p>
                <p className="text-xs text-muted-foreground">Tự động đánh dấu pass cho ứng viên đủ tiêu chuẩn.</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <Switch checked={autoPassEnabled} onCheckedChange={handleTogglePass} />
              )}
            </div>

            <div className="rounded-md border bg-muted/20 p-3 text-xs">
              <p className="mb-1 font-medium">Logic mô phỏng hiện tại</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>- Reject nếu score &lt; 60 hoặc thiếu required skills.</li>
                <li>- Pass nếu score &gt;= 75 và đạt các chỉ tiêu đang bật.</li>
                <li>- Nếu tất cả auto mode đều OFF -&gt; HR review thủ công.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái hiện tại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>Auto Reject</span>
              <Badge variant={autoRejectEnabled ? "success" : "outline"}>{autoRejectEnabled ? "ON" : "OFF"}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>Auto Pass</span>
              <Badge variant={autoPassEnabled ? "success" : "outline"}>{autoPassEnabled ? "ON" : "OFF"}</Badge>
            </div>
            <div className="rounded-md border p-2 text-xs text-muted-foreground">
              Mẹo: Nếu đang trong đợt tuyển gấp, bạn có thể bật Auto Pass và tắt Auto Reject để HR ưu tiên contact
              nhanh.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Quy trình xử lý mẫu
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {mockPipeline.map((item) => (
            <div key={item.step} className="rounded-md border p-3">
              <p className="mb-1 text-xs text-muted-foreground">Bước</p>
              <p className="text-sm font-medium">{item.step}</p>
              <Badge className="mt-2" variant={item.done ? "success" : "outline"}>
                {item.done ? "Hoàn thành" : "Chờ xử lý"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
