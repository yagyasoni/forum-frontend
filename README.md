# forum-frontend

Web app for the AuditProRx community forum. Next.js 16, React 19, TypeScript, Tailwind 4, App Router.

## Run locally

```bash
cp .env.local.example .env.local   # point at forum-backend
npm install
npm run dev                         # http://localhost:3000
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — eslint

## Mock mode

`NEXT_PUBLIC_USE_MOCK=true` in `.env.local` makes every API call answer from `lib/mock.ts`, so the app runs with no backend. Set it to `false` once forum-backend is up; nothing else changes.

## Layout

```
app/
  layout.tsx          top bar + sidebar + content area, shared by every page
  page.tsx            Home: tabs, category filter, search, lookup box, thread list
  t/[id]/page.tsx     one open thread, same layout
  error.tsx           shown when the API fails
  not-found.tsx       shown for a bad thread id
components/
  TopBar.tsx          logo, search box, Sign in
  Sidebar.tsx         loads categories for the left column (server)
  SidebarNav.tsx      Home, category links, Sign in card (client, highlights the active one)
  RightRail.tsx       about, guidelines, and AuditProRx cards on wide screens
  SignInDialog.tsx    the one sign-in dialog + SignInButton to open it
  FilterStrip.tsx     Latest / Top / Unanswered tabs + category dropdown (phones)
  LookupBox.tsx       BIN / PCN / Group lookup with inline results
  ThreadList.tsx      thread cards for one page + pagination bar
  ThreadCard.tsx      one thread card: author, title, excerpt, image, votes, inline comments
  ThreadView.tsx      post, comments, sign-in-to-comment prompt
  Avatar.tsx          initials avatar with a stable color per username
  ImageLightbox.tsx   post image that opens full size when clicked
  CopyLink.tsx        Share button that copies the thread URL
  Logo.tsx            the AuditProRx mark
lib/
  api.ts              every call to forum-backend (or mock.ts in mock mode)
  mock.ts             sample data for the visitor prototype
  types.ts            shared shapes, same as the backend JSON
  utils.ts            cx, timeAgo, compact, homeHref
```
