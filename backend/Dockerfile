# ==========================================
# 👑 KEN ENTERPRISE - BACKEND DOCKERFILE v1.0
# Multi-stage production build (Alpine-based, Non-root secure user)
# ==========================================

# --- Stage 1: Dependency Builder ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Salin package manifests untuk optimalisasi cache layer Docker
COPY package*.json ./

# Install dependensi (termasuk devDependencies untuk testing/build)
RUN npm ci

# Salin seluruh core source code
COPY . .

# --- Stage 2: Final Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Set node environment ke production
ENV NODE_ENV=production
ENV PORT=3001

# Salin package manifests
COPY package*.json ./

# Install HANYA production dependencies (mengurangi footprint image)
RUN npm ci --only=production

# Salin core code & node modules dari builder
COPY --from=builder /usr/src/app/src ./src

# Buat grup dan user non-root secure demi zero-trust security compliance
RUN addgroup -g 1001 -S nodejs && \
    adduser -S node -u 1001 -G nodejs && \
    chown -R node:nodejs /usr/src/app

# Jalankan container menggunakan user non-root
USER node

# Ekspos port server backend Express
EXPOSE 3001

# Lakukan healthcheck berkala untuk orkestrasi Kubernetes/Compose
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/system/health').then(r => r.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || exit 1

# Entrypoint start script command
CMD ["node", "src/server.js"]
