# ── Stage 1: Build Frontend ──
# bookworm-slim (glibc) so node_modules built here match the Debian runtime below
FROM node:20.19.5-bookworm-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# ARG only (no ENV) so the key is available to the build but not stored in image config
ARG NEXT_PUBLIC_TOMTOM_API_KEY=

RUN npm run build && npm prune --production

# ── Stage 2: Backend Dependencies ──
FROM python:3.11.14-slim-bookworm AS backend-builder
WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 3: Node.js source (binaries only, no install script) ──
FROM node:20.19.5-bookworm-slim AS node-runtime

# ── Stage 4: Production Runtime ──
FROM python:3.11.14-slim-bookworm AS runner
WORKDIR /app

# curl for health checks, certificates, and libstdc++ for the Node binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libstdc++6 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20 copied from the pinned official image (same Debian base as this stage)
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && node --version

# Non-root runtime user (home dir needed by npm)
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --create-home app

# Copy Python packages & backend code
COPY --from=backend-builder /install /usr/local
COPY --chown=app:app backend/ /app/backend/

# Copy built frontend assets and pruned production dependencies
COPY --chown=app:app --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules /app/frontend/node_modules
COPY --from=frontend-builder /app/frontend/package.json /app/frontend/package.json
COPY --from=frontend-builder /app/frontend/public /app/frontend/public

# Copy entrypoint startup script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000 3000

# Production mode disables /docs, /redoc and DEBUG behaviour (see backend/app/core/config.py)
ENV APP_ENV=production
ENV DEBUG=false
ENV PYTHONUNBUFFERED=1
ENV CORS_ORIGINS=http://localhost:3000,http://localhost:8000

USER app

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
