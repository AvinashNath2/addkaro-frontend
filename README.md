# AddKaro — Frontend

React web app for the AddKaro hoarding marketplace. Connects directly to the Spring Boot backend — no broker, no middleman.

---

## Quick Start

```bash
npm install
npm run dev
```

App runs at **http://localhost:3000**. The Vite dev server proxies `/api/*` → `http://localhost:8080` automatically.

Backend must be running — see `../backend/README.md`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5 |
| Framework | React 18 |
| Build | Vite 5 |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| HTTP | Axios (with interceptors) |
| Forms | React Hook Form + Zod |
| Global state | Zustand (auth only) |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |

---

## Pages & Routes

### Public

| Route | Page | Description |
|---|---|---|
| `/` | `LandingPage` | Marketing page — hero, how it works, CTA |
| `/login` | `LoginPage` | Email + password login |
| `/register` | `RegisterPage` | Account creation (Customer or Owner) |
| `/browse` | `BrowsePage` | Search hoardings with filters, map view |
| `/browse/:id` | `HoldingDetailPage` | Full hoarding detail, offer form, chat |

### Customer (must be logged in as CUSTOMER)

| Route | Page | Description |
|---|---|---|
| `/my-offers` | `MyOffersPage` | All submitted offers with status badges; edit/view detail |
| `/wishlist` | `WishlistPage` | Saved hoardings |

### Owner (must be logged in as OWNER)

| Route | Page | Description |
|---|---|---|
| `/owner/dashboard` | `OwnerDashboardPage` | Stats, recent offers, quick actions |
| `/owner/holdings` | `OwnerHoldingsPage` | All listings with status filter tabs |
| `/owner/holdings/new` | `CreateHoldingPage` | Create a listing (draft or full submit) |
| `/owner/holdings/:id/edit` | `EditHoldingPage` | Edit a DRAFT / PENDING / REJECTED listing |

### Admin (must be logged in as ADMIN)

| Route | Page | Description |
|---|---|---|
| `/admin` | `AdminDashboardPage` | Platform-wide stats |
| `/admin/holdings` | `AdminHoldingsPage` | Review queue + all listings; approve / reject / suspend |
| `/admin/users` | `AdminUsersPage` | All users |

### Auth

| Route | Page |
|---|---|
| `/settings` | `UserSettingsPage` — update name/phone |
| `/chat/:offerId` | `ChatPage` — standalone chat view |

---

## Project Structure

```
src/
├── api/                   # API call functions (one file per domain)
│   ├── axios.ts           # Axios instance: base URL, X-User-Id interceptor, error unwrapping
│   ├── auth.api.ts
│   ├── holdings.api.ts
│   ├── owner.api.ts
│   ├── customer.api.ts
│   └── admin.api.ts
│
├── store/
│   └── auth.store.ts      # Zustand: logged-in user, login/logout actions
│
├── types/
│   └── index.ts           # All TypeScript interfaces (HoldingDetail, OwnerHolding, CustomerOffer, etc.)
│
├── lib/
│   ├── utils.ts           # cn() helper
│   └── schemas/           # Zod validation schemas
│       ├── holding.schema.ts
│       └── offer.schema.ts
│
├── components/
│   ├── layout/            # AppLayout, Sidebar, Header
│   ├── ui/                # StatusBadge, StatCard, StatusChangeModal
│   ├── browse/            # HoldingMap (leaflet)
│   └── chat/              # ChatBox
│
├── pages/
│   ├── landing/           # LandingPage
│   ├── auth/              # LoginPage, RegisterPage
│   ├── browse/            # BrowsePage, HoldingDetailPage
│   ├── customer/          # MyOffersPage, WishlistPage
│   ├── owner/             # OwnerDashboardPage, OwnerHoldingsPage, CreateHoldingPage, EditHoldingPage
│   ├── admin/             # AdminDashboardPage, AdminHoldingsPage, AdminUsersPage
│   ├── chat/              # ChatPage
│   └── settings/          # UserSettingsPage
│
├── App.tsx                # Route definitions + protected route wrappers
├── main.tsx               # Entry: QueryClient + BrowserRouter + Zustand hydration
└── index.css              # Tailwind directives + shared component classes (.btn-primary, .input-field, etc.)
```

---

## Auth Flow

1. User logs in → backend returns `userId`, `name`, `role`, `token`
2. Stored in Zustand (`auth.store.ts`) and persisted to `localStorage`
3. The Axios interceptor reads `userId` from the store and adds `X-User-Id: <userId>` to every request
4. Protected routes check the Zustand store for the correct role and redirect to `/login` if missing

---

## API Pattern

All data fetching uses TanStack Query. The Axios instance automatically:
- Adds `X-User-Id` header from the auth store
- Unwraps the `CoreResponse<T>` envelope — `res.data.data` is returned directly
- Surfaces `res.data.message` as the error message string, so `mutation.error.message` just works

**Query (GET):**
```ts
const { data, isLoading } = useQuery({
  queryKey: ['holdings', filters],
  queryFn: () => searchHoldings(filters),
})
```

**Mutation (POST/PUT/DELETE):**
```ts
const mutation = useMutation({
  mutationFn: (data) => createHolding(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-holdings'] }),
})
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |

Type-check only (uses `tsconfig.app.json`, not the root tsconfig):
```bash
node_modules/.bin/tsc --noEmit -p tsconfig.app.json
```
