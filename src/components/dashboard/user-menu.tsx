"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Header account menu. Sign-out posts to the /auth/signout route handler so the
 * cookie clearing happens server-side. Kept dependency-free (no Radix) to stay
 * easy to drop into a future shadcn DropdownMenu without behavioural change.
 */
export function UserMenu({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-4 w-4" aria-hidden />
        </span>
        <span className="hidden max-w-[12rem] truncate font-medium sm:inline">
          {name || email}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 z-20 mt-1 w-56 origin-top-right rounded-md border bg-card p-1 shadow-md",
          open ? "block animate-fade-in" : "hidden",
        )}
      >
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{name || "Signed in"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="my-1 h-px bg-border" />
        {/* TODO: profile page route */}
        <button
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          onClick={() => alert("Profile page coming soon.")}
        >
          <User className="h-4 w-4" aria-hidden /> Profile
        </button>
        <form action="/auth/signout" method="post">
          <button
            role="menuitem"
            type="submit"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
