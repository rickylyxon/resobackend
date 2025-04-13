# Step 1: Build stage
FROM node:22-alpine AS builder

# Set custom working directory
WORKDIR /resobackend

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire source
COPY . .

# Build the TypeScript project
RUN npm run build

# Step 2: Production stage
FROM node:22-alpine

# Set working directory in production container
WORKDIR /resobackend

# Copy from build stage
COPY --from=builder /resobackend/package*.json ./
COPY --from=builder /resobackend/node_modules ./node_modules
COPY --from=builder /resobackend/dist ./dist
COPY --from=builder /resobackend/prisma ./prisma
COPY --from=builder /resobackend/.env .env

# Install Prisma CLI globally for migrations (optional)
RUN npm install -g prisma

# Expose the port your app runs on
EXPOSE 4000

# Run Prisma commands and start the app
CMD ["sh", "-c", "prisma generate && prisma migrate deploy && node dist/index.js"]
