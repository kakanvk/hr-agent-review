import { ScanEye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export type EmailItem = {
  id: string
  threadId: string
  from: string
  subject: string
  date: string
  isUnread?: boolean
}

type EmailListItemsProps = {
  emails: EmailItem[]
  analyzingId?: string
  onAnalyzeEmail: (email: EmailItem) => void
}

export function EmailListItems({ emails, analyzingId, onAnalyzeEmail }: EmailListItemsProps) {
  return (
    <ul className="space-y-3">
      {emails.map((email) => (
        <li key={email.id}>
          <Card className="transition rounded-md hover:border-primary/40 hover:bg-muted/20">
            <CardContent className="space-y-3 p-4 py-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {email.isUnread && <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />}
                  <p className={`truncate ${email.isUnread ? "font-semibold" : "font-medium"}`}>
                    {email.subject || "(Không có tiêu đề)"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={email.isUnread ? "default" : "secondary"}>
                    {email.isUnread ? "Chưa đọc" : "Đã đọc"}
                  </Badge>
                  <Badge variant="outline">Gmail</Badge>
                  <Button
                    size="sm"
                    disabled={analyzingId === email.id}
                    onClick={() => onAnalyzeEmail(email)}
                  >
                    <ScanEye className="size-3.5" />
                    {analyzingId === email.id ? "Đang phân tích..." : "Phân tích CV"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Từ: {email.from || "Không rõ"}</p>
              <p className="text-xs text-muted-foreground">Ngày: {email.date || "Không rõ"}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
