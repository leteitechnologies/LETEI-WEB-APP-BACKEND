# Stage 1 — build
FROM node:20-alpine AS builder
WORKDIR /app

# copy package files for caching
COPY package*.json ./

# ensure schema present before installing so postinstall (prisma generate) can run
COPY src/prisma ./prisma

# install dev deps (postinstall runs here and will find schema)
RUN npm ci --production=false

# copy rest of source and build
COPY . .
RUN npm run build

# Stage 2 — production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# copy package files
COPY package*.json ./

# copy schema BEFORE npm ci so postinstall prisma generate works
COPY src/prisma ./prisma

# install production deps (postinstall will run and succeed)
RUN npm ci --production=true

# copy built artifacts
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
