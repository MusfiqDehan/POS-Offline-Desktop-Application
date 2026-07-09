import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "success" && "bg-success/15 text-success",
        variant === "outline" && "border border-border text-secondary",
        variant === "default" && "bg-primary-100 text-secondary",
        className,
      )}
      {...props}
    />
  );
}
