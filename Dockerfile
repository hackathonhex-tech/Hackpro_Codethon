FROM node:20-bookworm-slim

# Install compilers & process isolation utilities for Java, Python, C# (Mono), and prlimit
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jdk-headless \
    python3 \
    python-is-python3 \
    mono-mcs \
    mono-runtime \
    util-linux \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages ./packages
COPY backend/package.json ./backend/package.json

# Install dependencies (including TypeScript to compile @codeathon/shared)
RUN npm ci

# Copy backend source
COPY backend ./backend

# Build shared workspace package
RUN npm --workspace=@codeathon/shared run build

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/backend
EXPOSE 5000

CMD ["node", "src/server.js"]
