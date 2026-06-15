/**
 * Camco brand marks. The diamond is the Camco icon shape (chamfered square +
 * inner aqua diamond). Use BrandMark for the icon alone, BrandLogo for the
 * icon + "Camco" wordmark + "Investee Portal" lockup used in the app headers.
 */
export function BrandMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <rect
        x="6.5"
        y="6.5"
        width="19"
        height="19"
        rx="3.5"
        transform="rotate(45 16 16)"
        fill="#2C2E49"
      />
      <rect
        x="11.8"
        y="11.8"
        width="8.4"
        height="8.4"
        rx="2"
        transform="rotate(45 16 16)"
        fill="#35C3CF"
      />
    </svg>
  );
}

export function BrandLogo() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark size={26} />
      <span className="text-[17px] font-bold tracking-tight text-foreground">
        Camco
      </span>
      <span className="h-5 w-px bg-border" aria-hidden />
      <span className="text-sm font-medium text-muted-foreground">
        Investee Portal
      </span>
    </span>
  );
}
