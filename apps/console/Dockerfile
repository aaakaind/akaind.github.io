# Console Application Dockerfile
# Multi-stage build for React + Vite application

FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/console/package.json ./apps/console/
COPY packages ./packages/
RUN npm ci --workspace=@akaind/console

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build console app
RUN npm run build --workspace=@akaind/console

# Production image with nginx
FROM nginx:alpine AS runner

# Copy nginx configuration
COPY apps/console/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/apps/console/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
