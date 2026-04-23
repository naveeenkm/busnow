# BusNow — Frontend

A modern, mobile-first web app for tracking and viewing bus timings between cities. Built with **React + Vite + TypeScript + Tailwind CSS**, themed with the **Cloud White** design system, and powered by a separate Node.js/Express/MongoDB backend (see `/backend`).

---

## ✨ Features

- 🔍 **Smart search** with city auto-suggestions and browser geolocation (auto-detect "From" city via OpenStreetMap reverse geocoding)
- 🚌 **Live "Next Bus" highlight** — calculates minutes until the next departure in real time
- 📍 **Popular & frequently searched routes** surfaced on the homepage
- 📝 **Public route requests** — anyone can submit a missing route for admin approval
- 🔐 **JWT authentication** with persistent login (register / login / logout)
- ⭐ **Favorites & ride history** for logged-in users
- 🛠️ **Admin dashboard** to manage buses, approve route requests, and manage users
- 🌗 **Light / Dark mode** toggle
- 📱 **Mobile-first responsive** design with subtle, lightweight animations

---

## 🛠 Tech Stack

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| Framework      | React 18 + Vite 5 + TypeScript 5                   |
| Styling        | Tailwind CSS v3 (HSL semantic tokens)              |
| UI Components  | shadcn/ui (Radix primitives)                       |
| Routing        | React Router v6                                    |
| Data Fetching  | Axios + TanStack Query                             |
| Notifications  | Sonner                                             |
| Icons          | lucide-react                                       |

---

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui primitives
│   ├── BusCard.tsx
│   ├── BusForm.tsx      # Shared bus form (add/edit) with TimePicker & FrequencyPicker
│   ├── CityAutocomplete.tsx
│   ├── Navbar.tsx
│   ├── NavLink.tsx      # Active-aware NavLink wrapper
│   ├── ProfileSheet.tsx # User profile dialog (edit name, password, delete account)
│   ├── ProtectedRoute.tsx
│   └── SearchBar.tsx
├── contexts/            # Global React contexts
│   ├── AuthContext.tsx  # JWT auth state + silent token refresh
│   └── ThemeContext.tsx # Light/Dark mode
├── hooks/
│   ├── use-mobile.tsx   # useIsMobile hook (768px breakpoint)
│   └── use-toast.ts     # Toast hook
├── lib/
│   ├── api.ts           # Axios instance, Bearer token injection, auto-refresh on 401
│   ├── time.ts          # "Next bus in X mins" helpers
│   └── utils.ts
├── pages/
│   ├── Index.tsx        # Home (search + popular routes)
│   ├── SearchResults.tsx
│   ├── Login.tsx        # Login + Register (single page)
│   ├── RequestRoute.tsx # Public route request form
│   ├── Dashboard.tsx    # User: history + favorites
│   ├── Admin.tsx        # Admin: buses / requests / users
│   └── NotFound.tsx
├── test/
│   ├── example.test.ts  # Vitest example test
│   └── setup.ts         # Vitest setup
├── types/
│   └── index.ts         # User, Bus, RouteRequest, RideHistoryEntry, PopularRoute, Favorite
├── App.tsx              # Routes + providers
├── main.tsx
└── index.css            # Cloud White design tokens
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm (or bun)
- The backend running locally or deployed (see `/backend/README.md`)

### Installation

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and point it at your backend API:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

> When deploying, set `VITE_API_URL` to your production backend URL (e.g. `https://api.yourdomain.com/api`).

### Run the dev server

```bash
npm run dev
```

The app will be available at **http://localhost:8080**.

### Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## 🔐 Demo Credentials

The backend seeds these accounts on first run:

| Role  | Email                     | Password       |
| ----- | ------------------------- | -------------- |
| Admin | adminnaveen@gmail.com     | Kmnaveen@3124  |
| Demo  | demo@bustime.app          | demo1234       |

Admin access is auto-detected after login — there is no separate admin login page. The admin can delete the demo user from the **Users** tab in the admin dashboard.

---

## 🗺️ Routes

| Path             | Access          | Purpose                              |
| ---------------- | --------------- | ------------------------------------ |
| `/`              | Public          | Home — search + popular routes       |
| `/search`        | Public          | Search results for a route           |
| `/request-route` | Public          | Submit a new route request           |
| `/login`         | Public          | Login & Register                     |
| `/dashboard`     | Authenticated   | Ride history & favorites             |
| `/admin`         | Admin only      | Manage buses, requests, users        |

---

## 🎨 Design System

All colors are defined as **HSL semantic tokens** in `src/index.css` and exposed through `tailwind.config.ts`. Components reference tokens like `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, etc. — never raw colors.

The **Cloud White** palette: crisp whites, soft slate grays, with a clean blue primary, plus a fully matched dark mode.

---

## 🔌 Backend

The companion API lives in `/backend` (Node.js + Express + MongoDB + JWT).

See **`backend/README.md`** for setup, environment variables, and API documentation.

---

## 📦 Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`        | Start Vite dev server (port 8080)    |
| `npm run build`      | Production build                     |
| `npm run build:dev`  | Development build                    |
| `npm run preview`    | Preview the production build         |
| `npm run lint`       | Run ESLint                           |
| `npm run test`       | Run Vitest (single run)              |
| `npm run test:watch` | Run Vitest in watch mode             |
