# ---------- Builder Stage ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy ONLY package.json so npm generates native bindings for Linux
COPY package.json ./

# Install dependencies natively inside Linux
RUN npm install

# Copy application source code
COPY . .

# Build Next.js application
RUN npm run build


# ---------- Runtime Stage ----------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/publi[c] ./public/

EXPOSE 3000

CMD ["npm", "start"]