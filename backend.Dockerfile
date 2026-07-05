FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source
COPY src ./src

EXPOSE 4000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
