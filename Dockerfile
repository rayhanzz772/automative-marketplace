FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including dev for nodemon in dev mode)
RUN npm ci

# Copy application source
COPY . .

EXPOSE 8000

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "run", "dev"]
