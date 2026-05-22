FROM node:20-alpine

# Install git, openssh-client and bash (needed for git operations and push)
RUN apk add --no-cache git openssh-client bash

WORKDIR /app

# Enable pnpm
RUN npm install -g pnpm

# Copy dependency definitions
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies like tsx, vitest, etc.)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Dokploy will listen to this port for health checks.
# Daily updates run through a Dokploy scheduled task: pnpm cron:update
EXPOSE 3000

# Keep the app container healthy without running the updater on restart.
CMD ["pnpm", "healthcheck"]
