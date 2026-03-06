FROM node:24-alpine AS builder
LABEL authors="wygnd"

WORKDIR /app

COPY package*.json ./
COPY package-lock*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ----------------------------
# Production image
# ----------------------------
FROM node:24-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY package-lock*.json ./
COPY static ./static
COPY views ./views

ENV NODE_ENV=production
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]