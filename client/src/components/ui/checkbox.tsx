import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type CheckboxProps = Omit<React.ComponentProps<"button">, "onChange"> & {
  checked: boolean
  onCheckedChange: (checked: boolean | "indeterminate") => void
}

function Checkbox({ checked, onCheckedChange, className, ...props }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex items-center justify-center size-5 rounded border transition-all focus-visible:ring-2 focus-visible:ring-ring/40 outline-none shrink-0",
        checked ? "bg-primary border-primary" : "border-input bg-background hover:border-primary/50",
        className,
      )}
      {...props}
    >
      {checked && <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />}
    </button>
  )
}

export { Checkbox }
