import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Consistent loading spinner. Pass a size via className (e.g. "h-6 w-6"). */
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin text-muted-foreground", className)}
      aria-hidden="true"
    />
  );
}
