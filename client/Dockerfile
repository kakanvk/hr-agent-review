# Build stage
FROM node:22-alpine AS builder

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY client/. .

# Build the app
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install serve to run the built app
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/client/dist ./dist

# Expose port
EXPOSE 5173

# Start the app
CMD ["serve", "-s", "dist", "-l", "5173"]
