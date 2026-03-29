# Node.js server
FROM node:22-alpine

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/. .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "app.js"]
