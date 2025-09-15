FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN corepack enable && npm i -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start", "--", "-p", "3000"]
