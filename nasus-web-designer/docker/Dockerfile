# ============================================================
# Stage 1: Build frontend
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

# Copy source
COPY . .

# Build frontend (Vite)
# In Docker mode, Tauri is not available, so we inject a stub
RUN echo "// Docker stub: Tauri APIs replaced with browser fetch" > /tmp/tauri-stub.js

RUN npm run build

# ============================================================
# Stage 2: Serve with nginx
# ============================================================
FROM nginx:alpine AS runtime

# Remove default nginx config and page
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Write nginx config inline
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;\n\
    gzip_min_length 1000;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
    add_header X-Frame-Options "SAMEORIGIN";\n\
    add_header X-Content-Type-Options "nosniff";\n\
    add_header Referrer-Policy "strict-origin-when-cross-origin";\n\
}\n' > /etc/nginx/conf.d/nasus.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
