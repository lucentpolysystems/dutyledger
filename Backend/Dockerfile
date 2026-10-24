FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma binary engine on Alpine
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy application source
COPY . .

EXPOSE 4500

# Automatically synchronize DB schema, seed baseline data if empty, and launch server
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && npm start"]
