# --- PRODUCTION BACKEND ENGINE ---
FROM node:20-alpine

# Security: Run as non-privileged user
RUN addgroup -S mandi && adduser -S mandi -G mandi

WORKDIR /app

# Optimize by caching dependencies
COPY package*.json ./
RUN npm install --production

# Transfer source code
COPY . .

# Ensure upload directory exists for local fallback
RUN mkdir -p public/uploads && chown -R mandi:mandi /app

USER mandi

EXPOSE 5000

ENV NODE_ENV=production

# Start the enterprise API
CMD ["npm", "start"]
