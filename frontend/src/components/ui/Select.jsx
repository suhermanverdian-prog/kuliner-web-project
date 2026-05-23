import * as React from "react"
import { cn } from "../../lib/utils"
import { ChevronDown } from "lucide-react"

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative group w-full">
      <select
        className={cn(
          "flex h-12 w-full appearance-none rounded-2xl border border-border bg-card/50 px-4 py-2 text-sm font-bold text-foreground shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
        <ChevronDown size={16} strokeWidth={3} />
      </div>
    </div>
  )
})
Select.displayName = "Select"

export { Select }
