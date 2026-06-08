# ==========================================
# 👑 KEN ENTERPRISE - FRONTEND DOCKERFILE v1.0
# Multi-stage production build (Node.js -> Nginx SPA Server)
# ==========================================

# --- Stage 1: Build static assets ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: Serve static assets with Nginx ---
FROM nginx:1.25-alpine AS runner

# Salin konfigurasi Nginx SPA custom yang aman
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin output build statis Vite ke folder Nginx html
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Ekspos port HTTP standard
EXPOSE 80

# Healthcheck Nginx web server
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
