# Stage 1 — build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Stage 2 — production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Install only production deps
COPY package*.json ./
RUN npm ci --production=true
# copy build from builder
COPY --from=builder /app/dist ./dist
# copy any necessary non-TS assets (e.g. prisma)
COPY src/prisma ./src/prisma
EXPOSE 3000
CMD ["node", "dist/main"]
