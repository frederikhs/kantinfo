# syntax=docker/dockerfile:1

FROM node:alpine AS development
WORKDIR /app
CMD ["sh", "-c", "npm ci && npm run dev"]

FROM node:alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=frontend-npm,target=/root/.npm \
    npm ci --prefer-offline
COPY . .
RUN npm run build

FROM nginx:mainline-alpine AS production
RUN rm /etc/nginx/conf.d/*
COPY <<EOF /etc/nginx/conf.d/nginx.conf
server {
    listen 80 default_server;
    listen 5173;
    server_name _;

    root  /usr/share/nginx/html;

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    location ~* \.(?:ico|css|js|gif|jpe?g|png|svg|woff2)$ {
        expires 30d;
        add_header Pragma public;
        add_header Cache-Control "public";
        etag off;

        gzip on;
        gzip_types text/css text/js;
    }

    location / {
        try_files \$uri /index.html;
    }
}
EOF

COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
