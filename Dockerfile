# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build the Vite / React client
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS client-build

WORKDIR /build

# Install dependencies first (better layer caching)
COPY client/package.json client/package-lock.json* ./
RUN npm ci --prefer-offline

# Copy source and build
COPY client/ .
RUN npm run build
# Output: /build/dist


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Python runtime
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.13-slim AS runtime

# Install uv (fast Python package installer)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy server source
COPY server/ ./server/

# Install Python dependencies
RUN uv pip install --system --no-cache -e ./server/

# Copy the built Vite bundle into server/static
# FastAPI's static files handler will serve these in production
COPY --from=client-build /build/dist ./server/static/

# Create persistent upload directories
RUN mkdir -p server/uploads/datasets server/uploads/models

WORKDIR /app/server

# Expose the API / UI port
EXPOSE 8000

# Health-check so container orchestrators know when the app is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"

# Run with a single worker by default; scale horizontally via replicas
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
