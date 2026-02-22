# ML Core

A self-hosted ML platform — upload datasets, train models, test them, and monitor everything from a Grafana-style dashboard.

---

## Running with Docker (recommended)

```bash
# Pull from Docker Hub
docker pull YOUR_USERNAME/mlcore:latest

# Pull from GitHub Container Registry
docker pull ghcr.io/YOUR_USERNAME/mlcore:latest

# Run
docker run -d \
  -p 8000:8000 \
  -v mlcore-db:/app/server \
  -v mlcore-uploads:/app/server/uploads \
  --name mlcore \
  YOUR_USERNAME/mlcore:latest
```

Open **http://localhost:8000** — the UI and the API are both served from the same port.

---

## Development

### Server (FastAPI)

```bash
cd server
uv pip install -e .
uv run dev          # http://localhost:8000
```

### Client (Vite + React)

```bash
cd client
npm install
npm run dev         # http://localhost:5173  (proxies /api → :8000)
```

---

## Building a new Docker image locally

```bash
docker build -t mlcore:local .
docker run -p 8000:8000 mlcore:local
```

---

## CI / CD

On every push to `main` / `master` or a semver tag (`v1.2.3`):

| Registry | Image |
|---|---|
| Docker Hub | `YOUR_USERNAME/mlcore` |
| GitHub Container Registry | `ghcr.io/YOUR_USERNAME/mlcore` |

**Required repository secrets:**

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (Settings → Security → New Access Token) |

`GITHUB_TOKEN` is provided automatically by GitHub Actions for GHCR.

---

## Architecture

```
┌──────────────────────────────────────────┐
│              Docker container            │
│                                          │
│  ┌─────────────┐   ┌──────────────────┐  │
│  │  FastAPI    │   │  Vite build      │  │
│  │  /api/*     │   │  served as       │  │
│  │             │   │  static files    │  │
│  └─────────────┘   └──────────────────┘  │
│           uvicorn :8000                  │
└──────────────────────────────────────────┘
```

- **API** → `/api/*`  
- **UI**  → everything else (SPA fallback to `index.html`)  
- **Uploads** → `server/uploads/datasets/` and `server/uploads/models/`  
- **Database** → SQLite at `server/mlcore_db.db` (mount a volume to persist)
