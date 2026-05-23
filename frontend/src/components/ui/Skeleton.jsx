import { cn } from "../../lib/utils";

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/30 relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-zinc-100/20 dark:before:via-white/5 before:to-transparent",
        className
      )}
      {...props}
    />
  );
};

export { Skeleton };
