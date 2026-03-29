import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type DatePickerProps = {
  value?: Date
  placeholder?: string
  onChange: (date?: Date) => void
}

const formatDate = (value?: Date) => {
  if (!value) {
    return ""
  }

  return value.toLocaleDateString("vi-VN")
}

export function DatePicker({
  value,
  placeholder = "Chọn ngày",
  onChange,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {formatDate(value) || placeholder}
          <CalendarIcon className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="single" selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  )
}
