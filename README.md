# AddKaro — Frontend

React web application for the AddKaro hoarding connection platform.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ (tested on v25) |
| npm | 9+ |
| Backend | Running on `localhost:8082` (see `../backend/README.md`) |

---

## Quick Start

```bash
cd frontend

# 1. Install dependencies (first time only)
npm install

# 2. Start dev server
npm run dev
```

App runs at **http://localhost:3000**.  
The Vite dev server automatically proxies `/api/*` → `http://localhost:8082` — no CORS issues.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Language | TypeScript 5 | Type safety end-to-end |
| Framework | React 18 | |
| Build | Vite 5 | Fast HMR, native ESM |
| Routing | React Router v6 | |
| Server State | TanStack Query v5 | Caching, loading/error states out of the box |
| HTTP Client | Axios | Interceptors for token + error unwrapping |
| Forms | React Hook Form + Zod | Type-safe validation |
| Global State | Zustand | Minimal setup for auth/user state |
| Styling | Tailwind CSS v3 | Utility-first |
| Icons | Lucide React | |

---

## Project Structure

```
src/
├── api/                   # All API call functions
│   ├── axios.ts           # Axios instance (base URL, token interceptor, error unwrapping)
│   └── auth.api.ts        # Auth endpoints (register, login)
│
├── lib/
│   ├── utils.ts           # cn() helper (clsx + tailwind-merge)
│   └── schemas/           # Zod validation schemas
│       └── auth.schema.ts
│
├── pages/                 # Route-level components
│   └── auth/
│       ├── RegisterPage.tsx
│       └── LoginPage.tsx
│
├── types/                 # TypeScript interfaces
│   └── auth.types.ts      # AuthUser, RegisterPayload, CoreResponse<T>
│
├── App.tsx                # Route definitions
├── main.tsx               # App entry — QueryClient + BrowserRouter
└── index.css              # Tailwind directives + shared component classes
```

---

## Adding a New Page

1. Create `src/pages/<domain>/<PageName>.tsx`
2. Add a `<Route>` in `src/App.tsx`
3. Add an API function in `src/api/<domain>.api.ts`
4. Define the Zod schema in `src/lib/schemas/<domain>.schema.ts`

---

## API Integration Pattern

All API calls use **TanStack Query**. The axios instance (`src/api/axios.ts`) automatically:
- Attaches the Bearer token from `localStorage`
- Unwraps the `CoreResponse<T>` envelope and surfaces the `message` on errors

**Query (GET):**
```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['holdings'],
  queryFn: () => fetchHoldings(),
})
```

**Mutation (POST/PUT/DELETE):**
```ts
const mutation = useMutation({
  mutationFn: registerUser,
  onSuccess: (user) => { /* navigate, store token, etc. */ },
})
```

---

## Response Envelope

The backend wraps every response in:
```json
{
  "code": "USER_REGISTERED",
  "message": "User registered successfully",
  "data": { ... }
}
```

The axios interceptor surfaces `data.message` as the error message string so you only need to read `mutation.error.message`.

---

## Environment

The dev proxy is hardcoded in `vite.config.ts` to `http://localhost:8082`.  
If your backend runs on a different port, update the `proxy.target` there.

---

## Pages Status

| Page | Path | Status |
|------|------|--------|
| Register | `/register` | ✅ Done |
| Login | `/login` | 🚧 Stub |
| Browse Holdings | `/browse` | ⬜ Planned |
| Holding Detail | `/holdings/:id` | ⬜ Planned |
| Customer — My Offers | `/my-offers` | ⬜ Planned |
| Customer — Wishlist | `/wishlist` | ⬜ Planned |
| Owner — Dashboard | `/owner/dashboard` | ⬜ Planned |
| Owner — My Holdings | `/owner/holdings` | ⬜ Planned |
| Owner — Create Holding | `/owner/holdings/new` | ⬜ Planned |
| Admin — Dashboard | `/admin` | ⬜ Planned |
