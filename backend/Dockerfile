FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./backend/
COPY database ./database
WORKDIR /app/backend
RUN npm ci
COPY backend/ .
RUN npm run prisma:generate && npm run build

FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json .
EXPOSE 4000
CMD ["node", "dist/server.js"]
