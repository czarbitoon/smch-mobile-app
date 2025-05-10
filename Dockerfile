# Use official Expo image for managed workflow
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the app
COPY . .

# Expose port for Metro bundler
EXPOSE 8081

# Start Expo
CMD ["npx", "expo", "start", "--tunnel"]