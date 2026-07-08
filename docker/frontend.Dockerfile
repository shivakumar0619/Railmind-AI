# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY frontend/package.json ./
RUN npm install --ignore-scripts

COPY frontend/ .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
