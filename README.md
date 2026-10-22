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

## Layout

```
app/           routes and layouts (App Router)
components/    shared UI, created as features are built
lib/           api client, types, helpers
public/        static files
```
