# ==========================================
# 1. Base / Dependencies
# ==========================================
FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ==========================================
# 2. Builder
# ==========================================
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ==========================================
# 3. Runner
# ==========================================
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR="/app/data"

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

# Copy built application assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/all_questions.json ./all_questions.json
COPY --from=builder /app/src/data ./src/data

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "server.js"]
