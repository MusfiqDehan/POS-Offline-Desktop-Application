import { cn } from "@/lib/utils";

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "warning";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variant === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-border bg-card text-secondary",
        className,
      )}
      {...props}
    />
  );
}
