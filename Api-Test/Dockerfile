FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/api_test?schema=public
RUN npx prisma generate

COPY src ./src
COPY scripts ./scripts
COPY tools ./tools
COPY docs ./docs
COPY postman ./postman
COPY eslint.config.js ./
COPY jest.config.mjs ./
COPY .prettierignore ./
COPY .prettierrc ./
COPY README.md ./
COPY RELEASE.md ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
