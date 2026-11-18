FROM node:24-bookworm-slim AS frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:24-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server/ ./
WORKDIR /app
COPY --from=frontend /app/client/dist ./client/dist
COPY supabase/ ./supabase/
USER node
EXPOSE 3001
CMD ["node", "server/index.js"]
