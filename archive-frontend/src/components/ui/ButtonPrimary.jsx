import React from "react";
import { cn } from "../../lib/utils";

/**
 * Primary button component following KEN Enterprise design system.
 * - Light mode: bg-amber-500 text-white hover:bg-amber-600
 * - Dark mode: bg-amber-400 text-zinc-900 hover:bg-amber-500
 * - Consistent interactive feedback: active:scale-95, transition-all, shadow
 * - Border radius: rounded-md (6px) per KEN 8px grid specification
 */
export const ButtonPrimary = ({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  size = "md",
  ...props
}) => {
  const sizeClasses = {
    sm: "h-8 px-4 text-sm",
    md: "h-10 px-6 text-base",
    lg: "h-12 px-8 text-lg",
  }[size];

  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-amber-500/20 dark:shadow-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20 dark:focus-visible:ring-amber-400/20";
  const enabledClasses =
    "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        enabledClasses,
        disabled ? disabledClasses : "",
        sizeClasses,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
