FROM node:22-slim

# Install Playwright system dependencies
RUN npx playwright install-deps chromium 2>&1 || apt-get update && apt-get install -y \
  libnss3 libnspr4 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 \
  libcairo2 libasound2 libatspi2.0-0 libcups2 libxfixes3 \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund && npx playwright install chromium 2>&1 && npm cache clean --force

COPY . .

EXPOSE 8080

CMD ["npx", "tsx", "src/index.ts"]