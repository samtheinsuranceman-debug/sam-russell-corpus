# Patent360 — one image, both halves.
#
# The client and the server were built separately and lived in separate
# repositories, which meant the application was deployable nowhere: Railway
# cannot reach the client's repo, and the server's repo had no client. This
# builds them together. Stage one compiles the React application; stage two
# runs FastAPI and serves that build alongside the API and the MCP connector,
# so a single URL answers for all three and they can never drift apart.

# ── Stage 1: the application ──────────────────────────────────────────────
FROM node:22-alpine AS web
WORKDIR /build

# Dependencies first, so a source edit does not re-resolve the tree.
COPY client/package.json client/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY client/ ./
RUN npm run build

# ── Stage 2: the server ───────────────────────────────────────────────────
FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
# The compiled client lands where main.py looks for it (WEB_ROOT).
COPY --from=web /build/dist ./web

# Railway supplies PORT; default so the image runs the same way locally.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
