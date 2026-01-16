# syntax=docker/dockerfile:1

# =========================
# 1) Build
# =========================
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# =========================
# 2) Runtime
# =========================
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# ---- Build args (recebidos no docker build) ----
ARG BOT_TOKEN
ARG WEBHOOK_LOGS_URL
ARG SUPABASE_KEY

# ---- Persistir na imagem como ENV (vai “ficar assim”) ----
ENV BOT_TOKEN="${BOT_TOKEN}"
ENV WEBHOOK_LOGS_URL="${WEBHOOK_LOGS_URL}"
ENV SUPABASE_KEY="${SUPABASE_KEY}"

# Outras envs podem ficar default aqui também, se quiser:
ENV SERVER_PORT=8080
ENV NODE_OPTIONS="--no-warnings --no-deprecation"

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/build ./build
COPY --from=build /app/constants.json ./constants.json

EXPOSE 8080
CMD ["node", "."]