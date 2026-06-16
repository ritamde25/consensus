import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent hover:border-border-hover disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})

Select.displayName = "Select"

export { Select }