import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-sans text-zinc-900 dark:text-zinc-100 shadow-sm transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-rose-500 focus-visible:ring-rose-500/20 focus-visible:border-rose-500" : "border-zinc-200 dark:border-zinc-700 focus-visible:border-amber-500",
          (type === "number" || type === "date") ? "font-mono tabular-nums" : "",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
