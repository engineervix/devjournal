FROM node:22-slim AS base

###################################################
# 📦 Install Dependencies
###################################################
FROM base AS deps

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies, including dev dependencies
RUN npm ci && npm cache clean --force

###################################################
# 📦 Install Production Dependencies
###################################################
FROM base AS production-deps

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Running `npm ci` removes the existing node_modules directory and passing in
# --omit=dev ensures that only the production dependencies are installed.
# This ensures that the node_modules directory is as optimized as possible
RUN npm ci --omit=dev && npm cache clean --force

###################################################
# 🛠️ Production Build
###################################################
FROM base AS build

RUN mkdir -p /home/node/app && chown node:node /home/node/app

# Set working directory
WORKDIR /home/node/app

# Use user "node" to run the rest of the commands below and the server itself.
USER node

# Copy node_modules from the installer stage
# In order to run `npm run build` we need access to some tooling,
# which come as dev dependencies.
COPY --chown=node:node --from=deps /app/node_modules /home/node/app/node_modules

# Copy project source code
COPY --chown=node:node . .

# Set environment variables
ENV NODE_ENV=production \
    PATH="/home/node/app/node_modules/.bin:$PATH"

# Build the application
RUN npm run build && npm cache clean --force

###################################################
# 🚀 Production
###################################################
FROM base

RUN mkdir -p /home/node/app && chown node:node /home/node/app

# Set working directory
WORKDIR /home/node/app

# Port used by this container to serve HTTP.
EXPOSE 3000

# Set environment variables
# - Set PORT variable, which should match "EXPOSE" command.
ENV PORT=3000 \
    NODE_ENV=production \
    PATH="/home/node/app/node_modules/.bin:$PATH"

# Use user "node" to run the rest of the commands below and the server itself.
USER node

COPY --chown=node:node --from=production-deps /app/node_modules /home/node/app/node_modules
COPY --chown=node:node --from=build /home/node/app/build /home/node/app

# Set the entrypoint script
# (Comment this out if deploying to an environment that uses the `Procfile`, like Heroku/Dokku)
COPY --chown=node:node entrypoint.sh ./
ENTRYPOINT ["./entrypoint.sh"]

# Runtime command that executes when "docker run" is called
CMD ["npm", "run", "start"]
