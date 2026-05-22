# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (npm install generates a lockfile if absent)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# ── Serve stage ────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove the default config
RUN rm /etc/nginx/conf.d/default.conf

# The official nginx image processes files in /etc/nginx/templates/ with envsubst
# at container start, outputting to /etc/nginx/conf.d/
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Backend URL — override at runtime:
#   docker run -e BACKEND_URL=http://your-backend-host:666 ...
#   or in docker-compose via environment:
#     BACKEND_URL: http://financial-system-v3:666
ENV BACKEND_URL=http://financial-system-v3:666

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
