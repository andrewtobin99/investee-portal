# Camco re-skin for the Investee Portal

These files restyle the running app to match the Camco brand mockup. The app is
token-driven, so most of the change lives in `globals.css` — the rest swaps the
logo, font, and a few brand colors.

## How to apply

Copy each file over the matching path in your repo (same relative location under
`src/`), then restart the dev server:

```
npm run dev
```

### Files included (drop-in replacements)
| This package | Replaces in your repo |
|---|---|
| `src/app/globals.css` | same — Camco color tokens (Midnight primary, branded border/muted, destructive) |
| `src/app/layout.tsx` | same — loads Source Sans 3 (free Proxima Nova stand-in) |
| `src/components/shared/brand-logo.tsx` | **new file** — Camco diamond mark + wordmark |
| `src/components/shared/status-badge.tsx` | same — Camco status palette + Rejected |
| `src/components/dashboard/stats-overview.tsx` | same — branded stat icon tints |
| `src/app/(investee)/layout.tsx` | same — diamond logo + "Camco · Investee Portal" |
| `src/app/admin/layout.tsx` | same — diamond logo + violet Admin pill |
| `src/app/(auth)/login/page.tsx` | same — diamond logo + brand tagline |

## One manual edit: `src/components/submissions/comment-thread.tsx`

Internal notes are amber in the original; the mockup uses Camco Violet. Make
these three swaps:

1. Internal message bubble — find:
   ```
   ? "border border-amber-200 bg-amber-50 text-foreground"
   ```
   replace with:
   ```
   ? "border border-[#E3D5F2] bg-[#F6F1FC] text-foreground"
   ```

2. "Internal" tag on a message — find:
   ```
   <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
   ```
   replace with:
   ```
   <span className="rounded-full bg-[#EEE7F7] px-1.5 py-0.5 text-[10px] font-medium text-[#6D30A7]">
   ```

3. Internal toggle (selected state) — find:
   ```
   isInternal ? "bg-amber-500 text-white" : "text-muted-foreground",
   ```
   replace with:
   ```
   isInternal ? "bg-[#6D30A7] text-white" : "text-muted-foreground",
   ```

Optional: in `comment-thread.tsx` the admin badge uses `bg-primary/10 text-primary`.
For an exact match to the mockup, change it to `bg-[#EEEAF6] text-[#6D30A7]`.

## Proxima Nova

Source Sans 3 is loaded as a free, close stand-in. If you license Proxima Nova
(Adobe Fonts), replace the `next/font/google` import in `layout.tsx` with the
Adobe Fonts `<link>` or `next/font/local` and update the `<html>` className.

## What this does NOT change

Behaviour, data, routes, and Supabase wiring are untouched — these are
presentation-only edits.
