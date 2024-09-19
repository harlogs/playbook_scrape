# Use the official Node.js 18 image as the base image
FROM node:18-bullseye-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies, including Puppeteer
# --unsafe-perm is required because Puppeteer needs to install Chromium
RUN npm install --unsafe-perm

# Install the necessary dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-glib-1-2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libxcomposite1 \
    libxrandr2 \
    libxdamage1 \
    libxfixes3 \
    xdg-utils \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium manually
# RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
#     && apt-get install -y ./google-chrome-stable_current_amd64.deb \
#     && rm google-chrome-stable_current_amd64.deb
# RUN which chromium

# Copy the rest of the application code to the working directory
COPY . .

RUN cp /usr/bin/chromium /app/chromium

# Expose the port the app runs on
EXPOSE 3000

# Set the environment variable for Puppeteer to run in a Docker container
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Command to run the Node.js app
CMD ["node", "index.js"]
