# Investee Portal

A Next.js 14 (App Router) + TypeScript front-end for the investee-facing side of
the submissions platform. It talks to an **existing** Supabase backend (auth,
multi-tenant Postgres schema, and a private `submission-documents` storage
bucket). All authorization is enforced by RLS — the UI assumes `401 =
unauthenticated`, `403 = forbidden`.

> Scope: **investee role only**. The codebase is structured so an admin
> experience can be added later as a sibling route group without reworking the
> shared component library.

---

## Tech stack

| Concern        | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Framework      | Next.js 14 App Router, React Server Components                |
| Language       | TypeScript                                                    |
| Styling        | Tailwind CSS + hand-rolled shadcn-style primitives            |
| Auth/session   | `@supabase/ssr` (cookie-based, refreshed in middleware)       |
| Data client    | `@supabase/supabase-js`                                       |
| Icons          | `lucide-react`                                                |

### Why these choices (deviations from the brief, noted explicitly)

- **`@supabase/ssr` over the older `auth-helpers`** — it's the current
  recommended pattern for the App Router and keeps the session valid across
  Server Components, Route Handlers, and middleware.
- **Hand-rolled UI primitives** (`src/components/ui/*`) instead of running
  `shadcn init`. They follow the same API shape (`cva` variants, `cn()` merge)
  so you can later replace any of them with the official shadcn component with no
  call-site changes.
- **`documents` table as the listing source of truth**, with Storage holding the
  bytes. `storage.list()` doesn't return reliable size/uploader/created-at
  metadata, so we insert a `documents` row on upload and list from there.
  (`storage.list()` usage is still shown in comments as an alternative.)

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.local.example .env.local
#   then fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
#   from Supabase → Project Settings → API

# 3. Run
npm run dev          # http://localhost:3000

# Quality gates
npm run typecheck
npm run lint
```

### Environment variables

| Variable                                | Required | Notes                                  |
| --------------------------------------- | -------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`              | yes      | Project URL                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | yes      | Public anon key (gated by RLS)         |
| `NEXT_PUBLIC_SUPABASE_DOCUMENTS_BUCKET` | no       | Defaults to `submission-documents`     |

---

## Deploying to Vercel

The app is a stock Next.js App Router project — Vercel auto-detects the build.
There is no server secret: the only env vars are the public Supabase URL + anon
key (RLS does the gatekeeping).

**Pre-flight (locally):** confirm a clean production build before deploying —
Vercel fails the build on type/lint errors.

```bash
npm run typecheck
npm run build
```

**1. Push to GitHub**

```bash
git push -u origin main      # after creating an empty GitHub repo
```

**2. Import into Vercel** → New Project → pick the repo. Framework preset
*Next.js* is detected automatically (root dir = repo root).

**3. Set Environment Variables** (Project → Settings → Environment Variables),
for Production *and* Preview:

| Key                               | Value                              |
| --------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | `https://<ref>.supabase.co`        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | your anon public key               |

`NEXT_PUBLIC_*` vars are inlined at build time, so **redeploy after changing
them**.

**4. Point Supabase at the deployed origin** (Supabase → Authentication → URL
Configuration):
- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**: add `https://<your-app>.vercel.app/**` (and your custom
  domain). This matters for password-reset / future email flows; password
  sign-in works without it, but set it now to avoid surprises.

**5. Smoke test the deployment**
- Visit the URL → you're redirected to `/login` (middleware guard works on
  Vercel's edge runtime).
- Sign in as the test investee → dashboard loads with submissions.
- Open a submission → upload a file, post a comment, confirm the realtime
  comment test still works against the same Supabase project.

> **CLI alternative:** `npm i -g vercel && vercel` (then `vercel --prod`). It
> prompts for the env vars on first deploy.

---

## How the auth flow works

1. **Sign in** — `LoginForm` calls `supabase.auth.signInWithPassword()` in the
   browser. The `@supabase/ssr` browser client writes the session to cookies.
2. **Session refresh + guard** — `middleware.ts` runs on every request,
   refreshes the session, and redirects:
   - unauthenticated → `/login?redirectedFrom=<path>`
   - authenticated on `/login` → `/dashboard`
3. **Server reads** — Server Components use `lib/supabase/server.ts`, which reads
   the session from cookies so every query runs as the signed-in user (RLS does
   the rest). `getUser()` (not `getSession()`) is used for authorization because
   it revalidates the token with the Auth server.
4. **Investee context** — `getCurrentInvestee()` resolves the `investees` row via
   `user_id`; `client_id` comes from that row and drives the storage path
   `{client_id}/{submission_request_id}/{filename}`.
5. **Sign out** — posts to `/auth/signout` (a Route Handler) which clears cookies
   server-side and redirects to `/login`.

### Error handling contract

`lib/utils/errors.ts#toAppError` normalises Supabase/PostgREST/Storage errors to
`unauthenticated | forbidden | not_found | network`. Server queries throw a
`PortalError`, which `app/(investee)/error.tsx` renders as: re-auth (401),
permission-denied (403), or retry (network). Per-file upload and per-row
download/delete errors are shown inline.

---

## Testing with the seeded investee user

The backend verification step creates a test investee. To exercise the portal:

1. Ensure that user has: an `investees` row (`user_id` = their auth id), at least
   one `submission_requests` row assigned to that investee, and a few
   `workflow_statuses` rows (slugs: `draft`, `submitted`, `under_review`,
   `follow_up_requested`, `approved`, `rejected`).
2. `npm run dev`, open `http://localhost:3000`, and sign in with the test
   credentials.
3. You should land on the dashboard with stats + the submission list. Open a
   submission to upload a document (stored at
   `{client_id}/{submission_request_id}/...`), download it via a signed URL,
   delete it, and post an external comment.

If sign-in succeeds but lists are empty, it's almost always RLS: confirm the
investee row's `user_id` matches the authenticated user and that the storage
bucket policies allow the `{client_id}/...` prefix.

---

## Project structure

```
investee-portal/
├── middleware.ts                      # session refresh + auth guard (root)
├── .env.local.example
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # root layout
│   │   ├── page.tsx                   # → /dashboard
│   │   ├── globals.css
│   │   ├── (auth)/login/page.tsx
│   │   ├── auth/signout/route.ts      # POST sign-out
│   │   └── (investee)/
│   │       ├── layout.tsx             # authed shell (header + user menu)
│   │       ├── error.tsx              # 401/403/network branch UI
│   │       ├── dashboard/
│   │       │   ├── page.tsx
│   │       │   └── loading.tsx        # skeletons
│   │       └── submissions/[id]/
│   │           ├── page.tsx
│   │           └── loading.tsx
│   ├── components/
│   │   ├── ui/                        # button, card, input, badge, skeleton, spinner
│   │   ├── auth/login-form.tsx
│   │   ├── dashboard/                 # stats-overview, submission-list, submission-card, user-menu
│   │   ├── submissions/               # submission-header, status-stepper, document-manager,
│   │   │                              #   document-list, file-upload-zone, comment-thread
│   │   └── shared/                    # status-badge, empty-state, error-boundary
│   ├── lib/
│   │   ├── supabase/                  # client, server, middleware, auth, queries
│   │   └── utils/                     # cn, format, errors
│   └── types/database.ts
```

---

## Assumptions & TODOs

**Assumptions** (adjust to the real schema if they differ):

- `investees(id, user_id, client_id, name)` links auth users to a client/tenant.
- `workflow_statuses(id, slug, label, sort_order)` with the six slugs above.
- `documents(id, submission_request_id, client_id, file_path, file_name,
  file_size, content_type, uploaded_by, created_at)`.
- Comment author role + display name are exposed via a `comment_author`
  relation, and an external visibility type exists in
  `comment_visibility_types(slug='external')`. **Both are marked TODO in
  `lib/supabase/queries.ts`** — confirm the real join/column names.
- Uploads are locked once a submission is `approved`/`rejected`.

**TODOs / future enhancements** (also marked inline in code):

- [ ] **Realtime**: subscribe to `comments` / `submission_status_history` inserts
      (`CommentThread` has the channel snippet).
- [ ] **True upload progress**: switch to resumable TUS uploads for byte-accurate
      progress bars (current bar is staged).
- [ ] **Password reset** flow (`resetPasswordForEmail`) — currently stubbed.
- [ ] **Profile page** route — menu item is stubbed.
- [ ] **Generated DB types** to replace hand-written `types/database.ts`.
- [ ] **Admin UI**: add an `(admin)` route group + role-based routing using
      `user_client_roles`.
- [ ] **SSO** and **email notifications** (backend-driven).
- [ ] **File preview** (PDF/image thumbnails) in the document list.
```
