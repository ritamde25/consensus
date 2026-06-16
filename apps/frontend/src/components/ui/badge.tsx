import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-surface text-primary-text",
        outline: "border-border bg-transparent text-secondary-text",
        success: "border-green-900 bg-green-950/50 text-green-400",
        warning: "border-orange-900 bg-orange-950/50 text-orange-400",
        destructive: "border-red-900 bg-red-950/50 text-red-400",
        yes: "border-green-900 bg-green-950/50 text-green-400",
        no: "border-red-900 bg-red-950/50 text-red-400",
        subtle: "border-border bg-surface-2 text-secondary-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
)

Badge.displayName = "Badge"

export { Badge }