import { ScanEye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export type EmailItem = {
  id: string
  threadId: string
  from: string
  subject: string
  date: string
  isUnread?: boolean
  analyzedCandidateId?: string
}

type EmailListItemsProps = {
  emails: EmailItem[]
  analyzingId?: string
  showCheckboxes?: boolean
  selectedIds?: Set<string>
  onAnalyzeEmail: (email: EmailItem) => void
  onSelectionChange?: (selectedIds: Set<string>) => void
  onViewAnalyzedEmail?: (email: EmailItem) => void
}

export function EmailListItems({ emails, analyzingId, showCheckboxes = false, selectedIds = new Set(), onAnalyzeEmail, onSelectionChange, onViewAnalyzedEmail }: EmailListItemsProps) {
  const handleCheckboxChange = (emailId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds)
    if (checked) {
      newSelectedIds.add(emailId)
    } else {
      newSelectedIds.delete(emailId)
    }
    onSelectionChange?.(newSelectedIds)
  }

  return (
    <ul className="space-y-3">
      {emails.map((email) => (
        <li key={email.id}>
          <Card
            className={`transition rounded-md ${showCheckboxes && selectedIds.has(email.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/40 hover:bg-muted/20'}`}
            onClick={() => {
              if (!showCheckboxes && email.analyzedCandidateId) {
                onViewAnalyzedEmail?.(email)
              }
            }}
          >
            <CardContent className="space-y-3 p-4 py-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {showCheckboxes && (
                    <Checkbox
                      checked={selectedIds.has(email.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(email.id, Boolean(checked))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  {email.isUnread && <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />}
                  <p className={`truncate ${email.isUnread ? "font-semibold" : "font-medium"}`}>
                    {email.subject || "(Không có tiêu đề)"}
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {email.analyzedCandidateId && (
                    <Badge
                      variant="success"
                      className="cursor-pointer bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                      onClick={() => onViewAnalyzedEmail?.(email)}
                    >
                      ✓ Đã phân tích
                    </Badge>
                  )}
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
