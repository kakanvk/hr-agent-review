import * as React from "react"
import * as DropdownMenuPrimitive from "radix-ui"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.DropdownMenu.Root>) {
  return <DropdownMenuPrimitive.DropdownMenu.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.DropdownMenu.Trigger>) {
  return <DropdownMenuPrimitive.DropdownMenu.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.DropdownMenu.Content>) {
  return (
    <DropdownMenuPrimitive.DropdownMenu.Portal>
      <DropdownMenuPrimitive.DropdownMenu.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.DropdownMenu.Portal>
  )
}

function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.DropdownMenu.Item>) {
  return (
    <DropdownMenuPrimitive.DropdownMenu.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger }
