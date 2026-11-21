# Database Setup and Migrations

This project uses PostgreSQL (hosted on Neon for production and preview environments, or running locally via Docker or a local PostgreSQL server).

## Local Development with Docker

To run PostgreSQL locally using Docker:

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container with:
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `miniproject`
- Connection URL: `postgres://postgres:postgres@localhost:5432/miniproject`

Set `DATABASE_URL` in your `.env`:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/miniproject
```

## Running Migrations

Database schema migrations are stored as SQL files in `migrations/` and managed with `scripts/migrate.mjs`.

To run migrations:
```bash
npm run db:migrate
```

The runner:
- Uses `DATABASE_URL_UNPOOLED` if set, otherwise falls back to `DATABASE_URL`.
- Tracks executed migrations in the `schema_migrations` table.
- Executes each pending migration inside an isolated transaction.
- Is idempotent; running it multiple times safely skips already applied migrations.

## Vercel Project Settings

Configure the following in the Vercel project dashboard:
- **Node.js Version**: 24.x
- **Framework Preset**: Next.js
- **Build Command**: `next build` (keep default; migrations run separately)
- **Install Command**: `npm ci`

## Neon Configuration & Branches

- Create the Neon database via the Vercel Marketplace integration, or directly on [neon.tech](https://neon.tech).
- Maintain dedicated database branches on Neon:
  - **Production branch**: Connected to the Vercel `Production` environment.
  - **Preview branch**: Connected to the Vercel `Preview` environment. Do not share one database branch between environments.
- Use the direct/unpooled connection string (`DATABASE_URL_UNPOOLED`) to run migrations against the target Neon branch prior to deployment:
  ```bash
  DATABASE_URL_UNPOOLED=... npm run db:migrate
  ```

## Environment Variables Reference

Configure these in Vercel for each environment (Production and Preview):
- `DATABASE_URL`: Pooled connection string from Neon (host contains `-pooler`). Used by the runtime application.
- `DATABASE_URL_UNPOOLED`: Direct (unpooled) connection string. Used for running migrations.
- `SESSION_SECRET`: 32+ random base64url bytes (unique per environment). Generate with:
  ```bash
  node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
  ```
- `OPENAI_API_KEY`: (Optional) API key if AI comparison features are used.
- `OPENAI_COMPARISON_MODEL`: (Optional) Model name supporting structured output.
- `GREENHOUSE_BOARDS`: (Optional) Comma-separated Greenhouse job board tokens.
