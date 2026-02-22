# ML Core — Server

FastAPI backend for the ML Core platform. Handles authentication, dataset management, model training, inference, and static file serving for the production client build.

## Tech Stack

| Layer | Library |
|---|---|
| API framework | FastAPI |
| ASGI server | Uvicorn |
| ORM | SQLAlchemy |
| Database | SQLite (file-based, zero-config) |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| ML engine | scikit-learn + joblib |
| Data | pandas + numpy |
| Auth | PyJWT + bcrypt + passlib |
| Logging | Loguru |
| Package manager | **uv** |
| Linter | Ruff |

---

## Prerequisites

- **Python** ≥ 3.10 — [python.org](https://www.python.org)
- **uv** — fast Python package manager

### Install uv

```bash
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Verify:

```bash
uv --version
```

> uv replaces pip + virtualenv. It creates and manages the `.venv` automatically.

---

## Getting Started

```bash
# 1. Move into the server directory
cd server

# 2. Create a virtual environment and install all dependencies
uv sync

# or install the package in editable mode explicitly
uv pip install -e .

# 3. Start the development server (auto-reload on file changes)
uv run dev
```

The API is now available at **http://localhost:8000**

Alembic migrations run automatically on startup — no manual `alembic upgrade head` needed.

---

## Available Commands

| Command | Description |
|---|---|
| `uv run dev` | Dev server with hot-reload at `:8000` |
| `uv run start` | Production server (no reload) |
| `uv run ruff check src` | Lint |
| `uv run ruff format src` | Auto-format |

These entry points are defined in `pyproject.toml`:

```toml
[project.scripts]
dev   = "scripts.server.cli:run_dev"
start = "scripts.server.cli:run_start"
```

---

## Project Structure

```
server/
├── alembic.ini            Alembic config
├── pyproject.toml         Project metadata, dependencies, ruff config
├── uv.lock                Locked dependency versions (commit this)
├── mlcore_db.db           SQLite database (git-ignored in production)
├── migrations/            Alembic migration scripts
│   └── versions/
├── scripts/
│   └── server/
│       └── cli.py         Entry points (run_dev / run_start)
├── static/                Built Vite client (production only, git-ignored)
├── uploads/
│   ├── datasets/          Uploaded CSV / Excel files
│   └── models/            Trained .joblib model files
└── src/
    ├── main.py            App factory, middleware, router mounting
    └── modules/
        ├── auth/          JWT authentication
        ├── dataset/       Dataset upload, versioning, wrangling
        ├── file/          File storage abstraction
        ├── ml_model/      Train, retrain, predict, download
        ├── stats/         Dashboard statistics
        └── user/          User management
```

---

## API Reference

All routes are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check + server version |
| `POST` | `/api/auth/login` | Login, returns JWT cookie |
| `POST` | `/api/auth/logout` | Logout, clears cookie |
| `GET` | `/api/datasets` | List datasets |
| `POST` | `/api/dataset/upload` | Upload a file |
| `POST` | `/api/dataset` | Create dataset record |
| `DELETE` | `/api/dataset/{id}` | Delete dataset + file |
| `POST` | `/api/ml_model/train` | Train a new model |
| `POST` | `/api/ml_model/{id}/predict` | Run inference |
| `GET` | `/api/ml_model/{id}/download` | Download `.joblib` file |
| `PATCH` | `/api/ml_model/{id}` | Edit name / description |
| `DELETE` | `/api/ml_model/{id}` | Delete model + file |
| `GET` | `/api/ml_model/hyperparameters/{algo}` | Get hyperparameter schema |

Full interactive docs available at **http://localhost:8000/docs** (Swagger UI).

---

## Database Migrations

Migrations run automatically on every startup via the `lifespan` handler in `main.py`.

To create a new migration after changing a model:

```bash
# From the server/ directory
uv run alembic revision --autogenerate -m "describe your change"
uv run alembic upgrade head
```

---

## Configuration

Settings are loaded from environment variables (via `pydantic_settings`). Defaults work out of the box for local development.

| Variable | Default | Description |
|---|---|---|
| `APP_VERSION` | read from `pyproject.toml` | Injected by Docker build |

---

## Linting

```bash
# Check
uv run ruff check src

# Fix auto-fixable issues
uv run ruff check src --fix

# Format
uv run ruff format src
```

Configuration lives in `pyproject.toml` under `[tool.ruff]`.

---

## Running in Production (without Docker)

```bash
cd server
uv pip install -e .
uv run start
```

Before starting, copy the built client into `static/`:

```bash
# From repo root
npm run build --prefix client
xcopy /E /I client\dist server\static   # Windows
# cp -r client/dist server/static       # macOS/Linux
```

---

## Docker

The recommended way to run in production is via the single Docker image built from the repo root:

```bash
# Build
docker build -t mlcore:latest .

# Run
docker run -d \
  -p 8000:8000 \
  -v mlcore-db:/data \
  -v mlcore-uploads:/app/server/uploads \
  --name mlcore \
  mlcore:latest
```

Open **http://localhost:8000** — UI and API served from the same port.

See the [root README](../Readme.md) for CI/CD and registry details.
