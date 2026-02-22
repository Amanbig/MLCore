# ML Core — Client

React 19 + TypeScript + Vite frontend for the ML Core platform.

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Build tool | Vite |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix UI primitives) |
| Charts | Recharts |
| HTTP client | Axios |
| State | Zustand |
| Linter / Formatter | Biome |

---

## Prerequisites

- **Node.js** ≥ 18 — [nodejs.org](https://nodejs.org)
- **npm** ≥ 9 (bundled with Node)
- ML Core **server** running on `http://localhost:8000`

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (proxies /api → :8000 automatically)
npm run dev
```

Open **http://localhost:5173**

The Vite dev proxy forwards every `/api/*` request to the FastAPI server — no CORS config needed locally.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR at `:5173` |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Biome lint check |
| `npm run format` | Biome auto-format all files |

---

## Production Build

```bash
npm run build
```

Output goes to `dist/`. In production this folder is copied into `server/static/` and served directly by FastAPI — no separate web server needed.

To manually wire it to the server:

```bash
# From the repo root
npm run build --prefix client
xcopy /E /I client\dist server\static
```

---

## Project Structure

```
src/
├── assets/          Static assets
├── components/
│   ├── ui/          shadcn/ui components
│   └── theme-provider.tsx
├── hooks/           Custom React hooks
├── layout/          App shell / sidebar layout
├── lib/
│   ├── api.ts       Axios instance (baseURL = /api)
│   └── utils.ts     cn() and other helpers
├── pages/
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── DatasetsPage.tsx
│   ├── ModelsPage.tsx
│   └── SettingsPage.tsx
└── store/
    └── auth.ts      Zustand auth store
```

---

## Environment

No `.env` file is required. The API base URL is always `/api` — Vite proxies it in development, and FastAPI serves it directly in production.

If you need to point at a remote server during development, edit `vite.config.ts`:

```ts
proxy: {
  "/api": {
    target: "http://your-remote-server:8000",
    changeOrigin: true,
  },
},
```

---

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) instead of ESLint + Prettier.

```bash
# Check lint
npm run lint

# Auto-fix formatting
npm run format
```

Configuration is in `biome.json`.
