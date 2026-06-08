import React from 'react';
import { cn } from "../../lib/utils";

const badgeVariants = {
  default: "bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80 border-transparent dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/80",
  primary: "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 border-transparent",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 border-transparent dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80",
  destructive: "bg-rose-500 text-white hover:bg-rose-500/80 border-transparent dark:bg-rose-900 dark:text-zinc-50 dark:hover:bg-rose-900/80",
  outline: "text-foreground",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <div className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2", badgeVariants[variant] || badgeVariants.default, className)} {...props} />
  );
}
