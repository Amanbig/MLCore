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

Three GitHub Actions workflows run automatically:

```
push to main
    │
    ├─► lint.yml        — ruff (server) + biome + tsc (client)  [every push / PR]
    │
    ├─► tag.yml         — reads version from pyproject.toml
    │                     creates git tag v<version> if it's new
    │
    └─► (tag push v*)
            │
            └─► docker.yml  — lint gate → read version → build & push image
```

### Releasing a new version

1. Bump `version` in `server/pyproject.toml` (e.g. `"0.1.0"` → `"0.2.0"`)
2. Commit & push to `main`
3. `tag.yml` detects the new version, auto-creates and pushes tag `v0.2.0`
4. `docker.yml` triggers on the tag, builds the image, pushes:
   - `YOUR_USERNAME/mlcore:0.2.0`
   - `YOUR_USERNAME/mlcore:latest`
   - `ghcr.io/YOUR_USERNAME/mlcore:0.2.0`
   - `ghcr.io/YOUR_USERNAME/mlcore:latest`

### Required repository secrets

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Security → New Access Token |

`GITHUB_TOKEN` is provided automatically for GHCR.

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
