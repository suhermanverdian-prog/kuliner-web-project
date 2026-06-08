import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

// Spinner SVG component (lightweight, no external deps)
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 mr-2 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    ></path>
  </svg>
);

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium uppercase tracking-widest transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20 disabled:pointer-events-none disabled:opacity-50 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-lg dark:shadow-none hover:-translate-y-[2px]",
        primary: "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-lg dark:shadow-amber-400/10 active:scale-95 transition-all",
        destructive: "bg-zinc-100 dark:bg-zinc-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-500 hover:text-white hover:-translate-y-[2px]",
        outline: "border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900",
        secondary: "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800",
        ghost: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5",
        link: "text-amber-500 underline-offset-4 hover:underline",
        premium: "bg-white text-zinc-950 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105",
      },
      size: {
        default: "h-14 px-10",
        sm: "h-10 rounded-lg px-4 text-xs",
        xs: "h-8 w-8 rounded-lg",
        lg: "h-16 rounded-lg px-14 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * @typedef {Object} ButtonProps
 * @property {keyof typeof buttonVariants.variants.variant} [variant]
 * @property {keyof typeof buttonVariants.variants.size} [size]
 * @property {boolean} [asChild]
 * @property {boolean} [isLoading]
 */

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className })
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && <Spinner />}
        {props.children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
