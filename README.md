# BarberFlow

**Simple bookings. Happier clients. A better barber business.**

BarberFlow is a production-style appointment management SaaS frontend for barber shops and
salons — built with React, TypeScript and Vite.

It ships with a complete in-memory demo dataset so it runs standalone, but every screen already
talks to a **repository abstraction**. Pointing the same UI at a real REST API (ASP.NET Core or
anything else) is a one-line environment change — no component, container or business rule is
touched.

---

## Table of contents

- [Overview](#overview)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Mock API mode vs. real API mode](#mock-api-mode-vs-real-api-mode)
- [REST API contract](#rest-api-contract)
- [Project architecture](#project-architecture)
- [Features](#features)
- [Roles and permissions](#roles-and-permissions)
- [Internationalisation](#internationalisation)
- [Production build](#production-build)

---

## Overview

| | |
|---|---|
| **Demo login** | `admin@barberflow.demo` / `Demo@123` — or press **Demo Login** |
| **Public booking portal** | `/book` — a customer-facing experience, not an admin screen |
| **Data** | 3 locations, 6 barbers, 8 services, 20 customers, ~5,000 generated appointments spanning 12 months of history plus 3 weeks of future bookings |
| **Latency** | Mock calls are delayed 300–700 ms so loading skeletons, spinners and disabled submit states are all exercised |

The demo dataset is **deterministic** — a fixed seed means the same numbers appear on every reload,
which matters when the app is being presented to a customer.

Mutations (booking, cancelling, editing, adding customers) are written to the in-memory store and
are immediately reflected on the dashboard, in reports and in customer history. A page reload
restores the seed.

---

## Technology stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 6 |
| Routing | React Router 6, with per-route code splitting |
| Styling | Tailwind CSS 3 (class-based dark mode) |
| HTTP | Axios, with centralised interceptors |
| Forms | React Hook Form + Zod resolvers |
| Charts | Recharts |
| Dates | date-fns |
| Icons | Lucide React |
| State | React Context (auth, settings, theme, toasts) + local component state |

No UI kit, no state-management library, no utility dependencies beyond the list above.

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build      # typecheck (tsc -b) then production bundle
npm run preview    # serve the production build locally
npm run typecheck  # types only
```

Copy the example environment file if you want to change defaults:

```bash
cp .env.example .env
```

---

## Environment variables

```env
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=https://api.example.com/api
VITE_APP_NAME=BarberFlow
VITE_DEFAULT_CURRENCY=USD
VITE_DEFAULT_TIMEZONE=America/New_York
```

| Variable | Purpose |
|---|---|
| `VITE_USE_MOCK_API` | `true` → in-memory repositories. `false` → Axios against `VITE_API_BASE_URL`. |
| `VITE_API_BASE_URL` | Base URL of the REST API. |
| `VITE_APP_NAME` | Wordmark shown in the sidebar, login page and portal. |
| `VITE_DEFAULT_CURRENCY` | Starting currency. Overridable at runtime in **Settings**. |
| `VITE_DEFAULT_TIMEZONE` | Starting timezone. Overridable at runtime in **Settings**. |

All of these are read in exactly one place — [`src/constants/config.ts`](src/constants/config.ts).
Nothing else in the codebase touches `import.meta.env`.

---

## Mock API mode vs. real API mode

The whole app programs against interfaces declared in
[`src/services/contracts.ts`](src/services/contracts.ts):

```ts
export interface AppointmentRepository {
  getAppointments(filters?: AppointmentFilters): Promise<Paginated<AppointmentDetail>>;
  getAppointment(id: ID): Promise<AppointmentDetail>;
  createAppointment(payload: CreateAppointmentRequest): Promise<Appointment>;
  updateAppointment(id: ID, payload: UpdateAppointmentRequest): Promise<Appointment>;
  deleteAppointment(id: ID): Promise<void>;
  updateStatus(id: ID, status: AppointmentStatus): Promise<Appointment>;
  reschedule(id: ID, payload: RescheduleAppointmentRequest): Promise<Appointment>;
  getAvailability(query: AvailabilityQuery): Promise<AvailabilitySlot[]>;
  createPublicBooking(payload: PublicBookingRequest): Promise<AppointmentDetail>;
}
```

Two implementations satisfy each contract:

- `src/services/mock/*` — `mockAppointmentRepository`, `mockCustomerRepository`, …
- `src/services/api/*` — `apiAppointmentRepository`, `apiCustomerRepository`, …

And exactly one place chooses between them —
[`src/services/index.ts`](src/services/index.ts):

```ts
const repositories: Repositories = USE_MOCK_API ? mockRepositories : apiRepositories;

export const appointmentRepository = repositories.appointments;
```

Pages import `appointmentRepository` and never learn which one they got. **No component contains an
HTTP call.**

### Switching to a live backend

1. Set `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL=https://your-api/api`.
2. Make the API return the shapes in [`src/types/`](src/types/).
3. Restart the dev server. That is the entire migration.

---

## REST API contract

The Axios implementations are already written against these endpoints.

### Authentication
| Method | Endpoint |
|---|---|
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
| POST | `/api/auth/refresh` |
| POST | `/api/auth/logout` |
| GET | `/api/auth/me` |

### Dashboard
| Method | Endpoint |
|---|---|
| GET | `/api/dashboard/summary` |
| GET | `/api/dashboard/revenue?range=` |
| GET | `/api/dashboard/appointments` |
| GET | `/api/dashboard/popular-services?limit=` |
| GET | `/api/reports?range=` |

### Appointments
| Method | Endpoint |
|---|---|
| GET | `/api/appointments` |
| GET | `/api/appointments/{id}` |
| POST | `/api/appointments` |
| PUT | `/api/appointments/{id}` |
| DELETE | `/api/appointments/{id}` |
| PATCH | `/api/appointments/{id}/status` |
| PATCH | `/api/appointments/{id}/reschedule` |
| GET | `/api/appointments/availability` |
| POST | `/api/appointments/public` |

### Customers
| Method | Endpoint |
|---|---|
| GET | `/api/customers` |
| GET | `/api/customers/{id}` |
| POST | `/api/customers` |
| PUT | `/api/customers/{id}` |
| DELETE | `/api/customers/{id}` |
| GET | `/api/customers/{id}/appointments` |
| GET | `/api/customers/stats` |

### Barbers
| Method | Endpoint |
|---|---|
| GET | `/api/barbers` |
| GET | `/api/barbers/{id}` |
| POST | `/api/barbers` |
| PUT | `/api/barbers/{id}` |
| DELETE | `/api/barbers/{id}` |
| GET | `/api/barbers/{id}/availability` |
| GET | `/api/barbers/{id}/stats` |
| GET | `/api/barbers/stats` |

### Services
| Method | Endpoint |
|---|---|
| GET | `/api/services` |
| GET | `/api/services/{id}` |
| POST | `/api/services` |
| PUT | `/api/services/{id}` |
| DELETE | `/api/services/{id}` |

### Locations
| Method | Endpoint |
|---|---|
| GET | `/api/locations` |
| GET | `/api/locations/{id}` |
| POST | `/api/locations` |
| PUT | `/api/locations/{id}` |
| DELETE | `/api/locations/{id}` |
| GET | `/api/locations/stats` |

### Settings
| Method | Endpoint |
|---|---|
| GET | `/api/settings` |
| PUT | `/api/settings` |

### Error handling

[`src/services/api/apiClient.ts`](src/services/api/apiClient.ts) installs the interceptors:

- **Request** — attaches `Authorization: Bearer <token>` from the stored session.
- **Response 401** — attempts a single token refresh, retries the original request, and signs the
  user out only if that also fails. Parallel 401s collapse into one refresh round-trip.
- **All failures** — normalised into one `ApiError { status, message, fieldErrors?, code? }`.
  Raw Axios text never reaches the UI: a 500 renders as *"Something went wrong. Please try again."*
- **422** — `ValidationProblemDetails` errors are camel-cased and mapped onto form fields, so
  server-side validation lands on the right input.

The mock repositories throw the **same** `ApiError` shape, so error UI is identical in both modes.

---

## Project architecture

```text
src/
├── components/
│   ├── common/       Button, Card, Modal, Drawer, Field, Badge, Avatar, Menu,
│   │                 Pagination, StatCard, Tabs, Rating, loading skeletons,
│   │                 ErrorState, EmptyState, ToastViewport, ErrorBoundary
│   ├── layout/       DashboardLayout, Sidebar, Topbar, MobileNav, GlobalSearch, Logo
│   ├── dashboard/    TodaySchedule, RevenueChart, PopularServices, BarberRoster
│   ├── appointments/ Table, filters bar, reschedule dialog, customer step
│   ├── calendar/     Day / Week / Month views, appointment drawer
│   ├── customers/    Customer form modal
│   ├── barbers/      Barber card, barber form modal
│   ├── services/     Service form modal
│   └── booking/      Stepper, DatePicker, TimeSlotPicker, selection cards,
│                     BookingSummary, SuccessAnimation
│
├── pages/            auth, dashboard, appointments, calendar, customers,
│                     barbers, services, locations, reports, settings, booking
│
├── services/
│   ├── contracts.ts  Repository interfaces — the seam between UI and data
│   ├── api/          Axios client + REST implementations
│   ├── mock/         In-memory implementations
│   └── index.ts      The single mock ⇄ API switch
│
├── mock/             Seed data + the in-memory database and its derived aggregates
├── hooks/            useAsyncData, useAsyncAction, useDebounce, useMediaQuery,
│                     useDisclosure, useClickOutside, useAppointmentActions
├── context/          Auth, Settings, Theme, Toast
├── types/            All domain models, centralised
├── utils/            currency, datetime, cn, helpers
├── constants/        config, domain metadata, navigation, permissions
├── routes/           Route table + auth/permission guards
├── App.tsx
└── main.tsx
```

### Design decisions worth knowing

**Data fetching is one primitive.** [`useAsyncData`](src/hooks/useAsyncData.ts) takes a repository
method and returns `{ data, loading, error, refetch, setData }`. It drops stale responses, so rapid
filter changes can never render out of order. `useAsyncAction` is its write-side companion and
drives every submit button's loading state.

**Joins happen in the data layer, not in components.** The API returns `AppointmentDetail` —
an appointment already expanded with customer, barber, service and location fields. No component
cross-references ids by hand.

**Aggregates are derived, never stored.** Customer visit counts, lifetime spend, VIP tier and
service booking counts are recomputed from the appointment ledger after every write, so the numbers
on the dashboard always reconcile with the list underneath them.

**One availability engine.** The admin wizard, the reschedule dialog and the public portal all call
the same `getAvailability` — so all three agree on what "available" means, and double-booking
returns a 409 that the UI recovers from by sending the user back to pick a new slot.

**Currency and dates are formatted in exactly one place.** No component concatenates a currency
symbol. Switching the shop to GBP, INR or AED in Settings updates every price in the app.

---

## Features

**Dashboard** — today's appointments, revenue, new customers and barber availability with
period-over-period movement; revenue/appointment chart with Today / Week / Month / Year ranges;
today's schedule timeline with a "next up" marker; popular services; live barber roster.

**Appointments** — filterable, searchable, paginated table (responsive cards on mobile) with view,
edit, reschedule, cancel, complete and delete; a detail page with inline editing.

**Calendar** — Day, Week and Month views with colour-coded blocks per barber, overlap-aware column
packing, a live "now" line, per-barber filtering, and a detail drawer on click.

**New appointment** — a five-step wizard (Customer → Service → Barber → Date → Time → Confirm) with
a live summary rail and a success animation. Bookable in well under 30 seconds.

**Customers** — stats, search and filtering, full CRUD, and a profile page with appointment history,
spending, favourite services, preferred barber and notes.

**Barbers** — cards with today's appointments, revenue and chair utilisation; a profile page with
performance, weekly schedule, live availability, services and reviews.

**Services** — card grid by category with full CRUD and enable/disable.

**Locations** — per-branch team, opening hours, appointment counts and revenue.

**Reports** — revenue by day, appointments by day, revenue by barber, popular services, customer
growth and appointment outcomes across five date ranges.

**Settings** — shop profile, business hours, booking rules, notifications, currency/timezone/date
format, and light/dark theme.

**Public booking portal** (`/book`) — a six-step customer-facing flow with its own layout, ending in
a confirmation screen with an appointment reference and a working **Add to Calendar** (`.ics`)
download.

**Throughout** — loading skeletons on every async screen, retryable error states, professional empty
states, toast notifications, a `/`-triggered global search, full keyboard focus states, reduced-motion
support, and light/dark themes.

---

## Roles and permissions

Roles are declared in [`src/constants/permissions.ts`](src/constants/permissions.ts) as a
role → permission map. Routes declare the permission they need and `AuthContext` answers, so adding
a role never means touching page code.

| Role | Access |
|---|---|
| **Admin** | Everything, including settings |
| **Manager** | Appointments, customers, barbers, services, locations, reports |
| **Barber** | Their own appointments, schedule and customers |
| **Receptionist** | Appointments and customers |

The demo signs in as **Admin**. Navigation, action menus and routes all filter themselves by
permission — a barber signing in sees only their own book.

---

## Internationalisation

- **Currency** — 7 currencies (USD, GBP, EUR, AUD, CAD, AED, INR) via a single
  [`formatCurrency`](src/utils/currency.ts) utility backed by `Intl.NumberFormat`.
- **Timezone** — 10 timezones, configurable per shop and per location.
- **Date and time format** — four date patterns, 12h/24h clock.
- **Country** — selectable on the shop profile and per location.

All are changeable at runtime in **Settings** and apply immediately across the app.

---

## Production build

```bash
npm run build      # → dist/
npm run preview
```

The build runs `tsc -b` first, so a type error fails the build. Output is code-split per route with
`react`, `recharts` and shared chunks separated for caching.

Deploy `dist/` to any static host. Because the app uses HTML5 routing, configure a
**SPA fallback** so unknown paths serve `index.html`:

- **Netlify** — `/* /index.html 200`
- **Vercel** — a rewrite of `/(.*)` to `/index.html`
- **nginx** — `try_files $uri $uri/ /index.html;`
- **IIS / ASP.NET Core** — `app.MapFallbackToFile("index.html")`

---

## Notes on the demo data

Names, emails, phone numbers and addresses are fictional. Barber and customer avatars are
generated from a public avatar service; branch photos are royalty-free stock. No real people are
represented.
