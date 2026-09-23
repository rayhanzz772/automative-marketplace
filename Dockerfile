FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including dev for nodemon in dev mode)
RUN npm ci

# Copy application source
COPY . .

# Fix Windows line endings (CRLF -> LF) and ensure executable permission
# This is needed because files created/edited on Windows have CRLF line endings
# which break the shebang (#!/bin/sh\r is invalid) and execute permission
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["sh", "/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]
