# syntax=docker/dockerfile:1.7

FROM node:20-bookworm AS frontend-build
WORKDIR /workspace/frontend-angular

COPY frontend-angular/package.json frontend-angular/package-lock.json ./
RUN npm ci

COPY frontend-angular/ ./
COPY docs/shared.css docs/responsive-pages.css docs/unified_media.css /workspace/docs/
RUN npm run build -- --configuration production

FROM node:20-bookworm AS backend-build
WORKDIR /workspace/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /app

COPY --from=backend-build --chown=node:node /workspace/backend/package.json ./package.json
COPY --from=backend-build --chown=node:node /workspace/backend/node_modules ./node_modules
COPY --from=backend-build --chown=node:node /workspace/backend/dist ./dist
COPY --from=frontend-build --chown=node:node /workspace/frontend-angular/dist/frontend-angular/browser ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "dist/main.js"]
