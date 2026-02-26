FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install

COPY . .
RUN pnpm --filter @convertr/web build

EXPOSE 3000
CMD ["pnpm", "--filter", "@convertr/web", "start"]
