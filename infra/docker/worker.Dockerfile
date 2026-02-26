FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/conversion-engine/package.json packages/conversion-engine/package.json
RUN pnpm install

COPY . .
RUN pnpm --filter @convertr/worker build

CMD ["pnpm", "--filter", "@convertr/worker", "start"]
