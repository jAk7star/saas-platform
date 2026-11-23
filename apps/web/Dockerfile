# syntax=docker/dockerfile:1.4
FROM node:22-alpine AS base

FROM base AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.23.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN pnpm install --frozen-lockfile --config.strict-dep-builds=false
RUN pnpm --filter @saas/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
